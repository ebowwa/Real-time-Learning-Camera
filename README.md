# Real-Time, On-Device Learning Camera

This application is a smart, real-time visual classifier that runs entirely in your web browser. It turns your device's camera into an intelligent system that you can teach to recognize new objects on the fly, with no server-side processing or external API calls required.

## ✨ Key Features

-   **On-Device AI:** All processing happens directly in your browser. No camera data is ever sent to a server, ensuring 100% privacy.
-   **Interactive Learning:** Teach the classifier by showing it an object and giving it a name.
-   **Real-time Classification:** Uses a sophisticated fingerprinting method analyzing both color and shape to instantly identify learned objects.
-   **Tunable Classifier:** A scalable control panel allows you to adjust the weight of each classification feature (e.g., Color, Shape) independently.
-   **CPU-Efficient:** A smart motion detection algorithm ensures classification only runs when needed, saving battery and processing power.
-   **Modular & Extensible:** The architecture is designed with a "composer" pattern, allowing new visual features to be plugged in easily.
-   **Zero Dependencies:** No need for API keys or server-side components. It just works.

---

## 🚀 How It Works: The Tech Behind the Magic

This project uses a modular architecture combining efficient motion detection with a multi-faceted computer vision technique for robust object recognition.

1.  **Motion Detection (The Gatekeeper):**
    -   To avoid constantly running expensive calculations, the app first checks for motion.
    -   It captures a tiny (32x32 pixel), grayscale version of the camera feed every few moments.
    -   By comparing the pixel data of the current frame to the previous one, it can quickly determine if significant motion has occurred.
    -   The more intensive classification step is only triggered when motion is detected.

2.  **Learning with Fingerprinting Features (A Modular Approach):**
    -   When you "learn" an object, the app orchestrates several modular, single-responsibility **feature extractors** to create a sophisticated "fingerprint" (`FeatureSet`). Each extractor specializes in one aspect of visual analysis:
        -   **Color Feature (`colorHistogram.ts`):** This captures the overall color distribution of the object, creating a profile of its colors via a histogram.
        -   **Shape Feature (`hogDescriptor.ts`):** This analyzes the object's texture and shape using a **Histogram of Oriented Gradients (HOG)**. It measures the *direction* of edges (e.g., horizontal, vertical, diagonal) to create a robust fingerprint of the object's structure.
    -   This combined fingerprint, along with the label you provide, is stored locally in the browser.

3.  **Recognition via Comparison (`localClassifier.ts`):**
    -   When motion is detected, the app generates a new fingerprint for the current camera view in real-time by calling the same feature extractors.
    -   It then uses a generic **comparator** module to compare the new fingerprint to the saved fingerprints of all learned objects.
    -   This comparator calculates a weighted similarity score based on the "Feature Weights" sliders. It dynamically normalizes these weights, allowing you to intuitively adjust the influence of each feature on the final decision.
    -   If the combined score is high enough, the app concludes it has found the object and displays its name.

This modular, "composer" architecture provides a fast, private, and robust method for real-time object recognition that can be easily extended with new features in the future.

---

## 🕹️ How to Use

1.  **Start the Camera:** Click the "Start Camera" button. You may need to grant your browser permission to access the camera.
2.  **Teach an Object:** Point your camera at an object you want the classifier to learn.
3.  **Give it a Name:** Type a name for the object in the input field (e.g., "Coffee Mug").
4.  **Learn:** Click the "Learn Object" button. The app will capture a frame and save the object's unique fingerprint to its memory.
5.  **Fine-Tune (Optional):** Use the sliders in the "Feature Weights" section to adjust the importance of each feature. For an object with a unique shape but common color, increase the "Shape" weight. For an object with a distinct color, increase the "Color" weight. The percentages show the real-time influence of each feature.
6.  **Recognize:** The classifier will now attempt to recognize the object whenever it's in the camera's view and there is motion.
7.  **Expand its Brain:** Teach it more objects! It will do its best to distinguish between them in real-time. You can view and manage all learned items in the "Memory" list.

---

## 🧠 A Roadmap for a Smarter Classifier

The current modular architecture is designed to be extensible. Here is a roadmap of potential new "fingerprinting features" that could be added to give the classifier new "senses" and make it even more powerful.

### 1. Spatial Features: Adding the "Where"
-   **What it is:** A **Spatial Grid** feature. Instead of one global histogram for an entire object, we can divide the image into a 2x2 or 3x3 grid and compute a feature (like color or HOG) for *each cell*. These are then combined into one long feature vector.
-   **Why it's useful:** This adds crucial spatial awareness. The classifier could learn not just that an object is "red and blue," but that the "top is red" and the "bottom is blue," allowing it to easily distinguish logos, flags, and other objects with distinct patterns.

### 2. Advanced Color: Understanding "Clumpiness"
-   **What it is:** A **Color Coherence Vector (CCV)**. This feature measures how "clumped together" different colors are within an object.
-   **Why it's useful:** It would allow the classifier to distinguish between a blue-and-white striped shirt (where colors are highly coherent) and a blue-and-white confetti pattern (where colors are scattered and incoherent), even if both have the exact same overall color profile.

### 3. Holistic & Robust Shape Analysis
-   **A. Hu Moments:** A set of seven unique numbers mathematically derived from an object's silhouette.
    -   **Why it's useful:** These seven numbers are magically invariant to an object's position, size, and rotation. This would allow the classifier to learn a key held upright and still recognize it perfectly when it's lying on its side, upside down, or further away from the camera.
-   **B. Keypoint Descriptors (e.g., ORB):** A more advanced technique that finds dozens of "interesting" unique points (keypoints) on an object, like corners or distinct patterns. It then creates a small digital descriptor for each keypoint. Classification is done by matching keypoints between the live view and the learned object.
    -   **Why it's useful:** This method is incredibly robust against changes in **rotation**, **scale**, and even **occlusion** (when part of the object is hidden).

### 4. Texture Analysis: Capturing the "Feel" of a Surface
-   **What it is:** **Local Binary Patterns (LBP)**. A powerful and efficient texture descriptor that creates a fingerprint of a surface by analyzing the local patterns of pixels.
-   **Why it's useful:** This unlocks a new dimension of analysis, allowing the classifier to distinguish between objects that have similar colors and shapes but different surface patterns. For example:
    -   An orange vs. a similarly colored tennis ball.
    -   A wooden block vs. a block of brushed metal.
    -   A book cover with text vs. a plain colored notebook.

### 5. The Deep Learning Frontier: On-Device Model Embeddings
-   **What it is:** Using a pre-trained, lightweight Convolutional Neural Network (CNN) like **MobileNetV3** (via a library like `TensorFlow.js`) to generate a single, powerful feature vector—an "embedding."
-   **Why it's useful:** This is the state-of-the-art. This single feature vector is incredibly rich and robust, encoding a high-level, semantic understanding of the object that includes complex concepts of shape, texture, and patterns simultaneously. It is far more resilient to changes in lighting, camera angle, and orientation than any hand-crafted feature.