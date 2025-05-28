import tensorflow as tf
import tensorflow_hub as hub
import numpy as np
import cv2
import matplotlib.pyplot as plt

# Load a pre-trained Faster R-CNN model from TensorFlow Hub
detector = hub.load("https://tfhub.dev/google/fasterrcnn/openimages_v4/inception_resnet_v2/1")

# Load and preprocess an image (you can replace with your own image)
def load_image(path):
    img = cv2.imread(path)
    img = cv2.cvtColor(img, cv2.COLOR_BGR2RGB)
    img_resized = tf.image.resize(img, (640, 640)) / 255.0  # Normalize
    return img, tf.expand_dims(img_resized, axis=0)

# Example image
img_path = 'path_to_your_image.jpg'  # replace with actual path
orig_img, input_tensor = load_image(img_path)

# Run object detection
result = detector(input_tensor)
result = {key: value.numpy() for key, value in result.items()}

# Visualize detection results
def draw_boxes(img, boxes, class_names, scores, threshold=0.5):
    for box, cls, score in zip(boxes, class_names, scores):
        if score < threshold:
            continue
        y1, x1, y2, x2 = box
        start_point = (int(x1 * img.shape[1]), int(y1 * img.shape[0]))
        end_point = (int(x2 * img.shape[1]), int(y2 * img.shape[0]))
        img = cv2.rectangle(img, start_point, end_point, (255, 0, 0), 2)
        label = f"{cls.decode('ascii')}: {score:.2f}"
        cv2.putText(img, label, start_point, cv2.FONT_HERSHEY_SIMPLEX, 0.5, (255,255,255), 1)
    return img

detected_img = draw_boxes(orig_img.copy(), result["detection_boxes"],
                          result["detection_class_entities"], result["detection_scores"])

plt.figure(figsize=(10, 10))
plt.imshow(detected_img)
plt.axis('off')
plt.title('Detected Objects with Faster R-CNN')
plt.show()
