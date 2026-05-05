# MAITRI Demo Script

## 1. Introduction (1 min)
- **Hook**: "Astronauts, deep-sea researchers, and isolated workers face severe mental health challenges. Introducing MAITRI, an autonomous companion for isolated environments."
- **Visual**: Show the splash screen loading sequence initializing local Edge AI models (MoveNet & Face API).
- **Core Value**: Emphasize that it runs locally, respects privacy, and provides immediate, context-aware support.

## 2. Core Interaction & Edge AI (2 min)
- **Action**: Enable Camera. Show how face detection immediately locks onto the user and recognizes them.
- **Visual**: Demonstrate the emotion detection ("Live" mode) recognizing a smile vs. a frown in real-time.
- **Chat**: Speak "Hey MAITRI. I feel a bit overwhelmed today."
- **Expected Outcome**: MAITRI's LLM processes the text and emotion locally, provides a comforting verbal response (TTS), and **auto-triggers** the Breathing Exercise overlay via the `[ACTION:breathing]` tag.

## 3. Wellness Interventions (2 min)
- **Breathing Tool**: Complete one cycle of the breathing exercise overlay.
- **Yoga Flow**: Click "Yoga flow", navigating to the Yoga trainer.
- **Action**: Perform the Mountain Pose and Tree Pose in front of the camera.
- **Visual**: MoveNet accurately draws the skeleton, turns green when correct, and runs the hold timer.
- **Action**: "End Session" to return to the main dashboard.

## 4. Advanced System Features (1.5 min)
- **Emergency Protocol**: Click the "Emergency" quick action. 
  - **Visual**: Siren animation starts, Web Audio API sounds, and simulated vitals + geolocation are displayed. Explain this sends an immediate SMS/Voice alert via Twilio.
  - **Action**: Cancel the emergency.
- **Dashboard**: Navigate to "Details" to show the Chart.js emotion tracking and recent session logs, demonstrating long-term health tracking.
- **Hand Gesture Scroll**: Wave hand vertically in front of the camera to scroll the page hands-free, emphasizing touchless interaction for sterile environments.

## 5. Conclusion (30s)
- **Summary**: "MAITRI combines real-time computer vision, large language models, and adaptive wellness features into a cohesive, private, and powerful support system."
- **Call to Action**: "Thank you. Let's make isolation a little less lonely."
