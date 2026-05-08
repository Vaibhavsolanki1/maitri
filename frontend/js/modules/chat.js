import { streamChat } from "./chatStream.js";
import { buildJsonHeaders, DEFAULT_USER_NAME } from "./config.js";

const DEFAULT_GREETING =
  "Welcome back. I am here with you. How are you feeling?";

function isNonEmptyString(value) {
  return typeof value === "string" && value.trim().length > 0;
}

function formatMeta(role, fallback) {
  const base = role === "user" ? "You" : role === "error" ? "System" : "MAITRI";
  return fallback ? `${base} • fallback` : base;
}

function createMessageElement({ text, role, loading, fallback, speakText }) {
  const message = document.createElement("div");
  message.className = `message ${role}`;
  if (loading) {
    message.classList.add("loading");
  }

  const content = document.createElement("p");
  content.textContent = text;
  message.appendChild(content);

  const meta = document.createElement("span");
  meta.className = "message-meta";
  meta.textContent = formatMeta(role, fallback);
  message.appendChild(meta);

  if (role !== "error" && typeof speakText === "function") {
    const actions = document.createElement("div");
    actions.className = "message-actions";
    const speakButton = document.createElement("button");
    speakButton.type = "button";
    speakButton.className = "speaker-button";
    speakButton.textContent = "Speak";
    speakButton.addEventListener("click", () => {
      speakText(text);
    });
    actions.appendChild(speakButton);
    message.appendChild(actions);
  }

  return { message, content, meta };
}

const ACTION_LABELS = {
  breathing: "Breathing Exercise",
  music: "Calming Audio",
  yoga: "Yoga Flow",
  report: "Daily Report",
  meditation: "Meditation"
};

function createActionConfirmElement(action, onConfirm, onDismiss) {
  const wrapper = document.createElement("div");
  wrapper.className = "action-confirm";

  const label = document.createElement("span");
  label.className = "action-confirm-label";
  label.textContent = `MAITRI suggests: ${ACTION_LABELS[action] || action}`;
  wrapper.appendChild(label);

  const startBtn = document.createElement("button");
  startBtn.className = "primary-button action-confirm-btn";
  startBtn.textContent = "Start";
  startBtn.addEventListener("click", () => {
    wrapper.remove();
    onConfirm();
  });
  wrapper.appendChild(startBtn);

  const dismissBtn = document.createElement("button");
  dismissBtn.className = "ghost-button action-confirm-dismiss";
  dismissBtn.textContent = "Dismiss";
  dismissBtn.addEventListener("click", () => {
    wrapper.remove();
    onDismiss();
  });
  wrapper.appendChild(dismissBtn);

  return wrapper;
}

function createTypingIndicator() {
  const wrapper = document.createElement("div");
  wrapper.className = "typing-indicator";
  for (let i = 0; i < 3; i += 1) {
    const dot = document.createElement("div");
    dot.className = "typing-dot";
    wrapper.appendChild(dot);
  }
  return wrapper;
}

export function createChatController({
  elements,
  endpoints,
  getContext,
  speakText,
  onAction,
  onRequireUpgrade
}) {
  const {
    chatForm,
    chatInput,
    chatMessages,
    chatSubmit,
    systemStatus
  } = elements;

  function scrollToBottom() {
    if (chatMessages) {
      chatMessages.scrollTop = chatMessages.scrollHeight;
    }
  }

  function renderGreeting() {
    if (!chatMessages) {
      return;
    }
    chatMessages.innerHTML = "";
    const { message } = createMessageElement({
      text: DEFAULT_GREETING,
      role: "system",
      speakText
    });
    chatMessages.appendChild(message);
  }

  function setLoadingState(isLoading) {
    if (chatSubmit) {
      chatSubmit.disabled = isLoading;
    }
    if (chatInput) {
      chatInput.disabled = isLoading;
    }
    if (systemStatus) {
      systemStatus.textContent = isLoading
        ? "Thinking"
        : "System ready";
    }
  }

  async function sendMessage(value) {
    if (!isNonEmptyString(value) || !chatMessages) {
      return;
    }

    const payload = getContext();
    const contextPayload = {
      message: value,
      userName: payload.userName,
      emotion: payload.emotion,
      emotionConfidence: payload.emotionConfidence,
      vitals: payload.vitals,
      emotionHistory: payload.emotionHistory
    };

    const { message: userMessage } = createMessageElement({
      text: value,
      role: "user",
      speakText
    });
    chatMessages.appendChild(userMessage);

    const assistant = createMessageElement({
      text: "",
      role: "system",
      loading: true,
      speakText
    });
    assistant.message.classList.add("is-streaming");
    assistant.content.appendChild(createTypingIndicator());
    chatMessages.appendChild(assistant.message);
    scrollToBottom();

    let replyText = "";
    let fallback = false;
    let action = null;

    setLoadingState(true);

    try {
      const streamResult = await streamChat({
        url: endpoints.chatStream,
        payload: contextPayload,
        headers: buildJsonHeaders(),
        onToken: (token) => {
          replyText += token;
          assistant.content.textContent = replyText;
          scrollToBottom();
        },
        onDone: (done) => {
          action = done.action || null;
          fallback = Boolean(done.fallback);
        }
      });

      if (!replyText) {
        replyText = streamResult.fullReply || "";
      }
    } catch (error) {
      if (error.status === 403 || error.status === 429) {
        if (typeof onRequireUpgrade === "function") {
          onRequireUpgrade("unlimitedChat");
        }
        assistant.message.remove();
        setLoadingState(false);
        return;
      }

      try {
        const response = await fetch(endpoints.chat, {
          method: "POST",
          headers: buildJsonHeaders(),
          body: JSON.stringify(contextPayload)
        });

        if (!response.ok) {
          if (response.status === 403 || response.status === 429) {
            if (typeof onRequireUpgrade === "function") {
              onRequireUpgrade("unlimitedChat");
            }
            assistant.message.remove();
            setLoadingState(false);
            return;
          }
          throw new Error(`Request failed (${response.status})`);
        }

        const data = await response.json();
        replyText = typeof data.reply === "string" ? data.reply.trim() : "";
        action = data.action || null;
        fallback = Boolean(data.fallback);
      } catch (fetchError) {
        assistant.message.remove();
        const { message } = createMessageElement({
          text: "Unable to reach MAITRI right now. Please try again.",
          role: "error"
        });
        chatMessages.appendChild(message);
        setLoadingState(false);
        scrollToBottom();
        return;
      }
    }

    assistant.message.classList.remove("loading", "is-streaming");
    assistant.content.textContent = replyText || "";
    assistant.meta.textContent = formatMeta("system", fallback);

    if (replyText) {
      speakText(replyText);
    }

    if (action && typeof onAction === "function") {
      const confirmUI = createActionConfirmElement(
        action,
        () => onAction(action),
        () => {
          if (typeof window.dismissPendingAction === "function") {
            window.dismissPendingAction();
          }
        }
      );
      chatMessages.appendChild(confirmUI);
      if (typeof window.setPendingAction === "function") {
        window.setPendingAction(action, () => {
          confirmUI.remove();
          onAction(action);
        });
      }
    }

    setLoadingState(false);
    scrollToBottom();
  }

  async function loadChatHistory(userName) {
    if (!chatMessages) {
      return;
    }

    try {
      const resolvedName = isNonEmptyString(userName)
        ? userName.trim()
        : DEFAULT_USER_NAME;
      const url = `${endpoints.history}?userName=${encodeURIComponent(
        resolvedName
      )}&limit=15`;
      const response = await fetch(url, { headers: buildJsonHeaders() });

      if (!response.ok) {
        throw new Error(`History request failed (${response.status})`);
      }

      const data = await response.json();
      const items = Array.isArray(data.items) ? data.items : [];

      chatMessages.innerHTML = "";

      if (items.length === 0) {
        renderGreeting();
        return;
      }

      items.forEach((item) => {
        const role = item.role === "assistant" ? "system" : item.role || "system";
        const { message } = createMessageElement({
          text: item.content || "",
          role,
          speakText
        });
        chatMessages.appendChild(message);
      });

      scrollToBottom();
    } catch (error) {
      console.warn("History load failed:", error);
    }
  }

  if (chatForm) {
    chatForm.addEventListener("submit", (event) => {
      event.preventDefault();
      if (!chatInput) {
        return;
      }
      const value = chatInput.value.trim();
      if (!value) {
        return;
      }
      chatInput.value = "";
      sendMessage(value);
    });
  }

  return {
    loadChatHistory,
    sendMessage
  };
}
