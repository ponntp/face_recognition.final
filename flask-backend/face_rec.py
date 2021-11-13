import math
from sklearn import neighbors
import os
import os.path
import pickle
from PIL import Image, ImageDraw
import base64
import io
import numpy as np
import torch
import face_recognition
from face_recognition.face_recognition_cli import image_files_in_folder
import cv2
from imageio import imread
import pathlib
from pathlib import Path

class FaceRec:
    def getTxt():
        return "from face_rec when t"

    def getTxt2():
        return "from face_rec when f"

    def train(train_dir, model_save_path=None, n_neighbors=None, knn_algo='ball_tree', verbose=False):
        """
        Trains a k-nearest neighbors classifier for face recognition.
        :param train_dir: directory that contains a sub-directory for each known person, with its name.
        (View in source code to see train_dir example tree structure)
        Structure:
            <train_dir>/
            ├── <person1>/
            │   ├── <somename1>.jpeg
            │   ├── <somename2>.jpeg
            │   ├── ...
            ├── <person2>/
            │   ├── <somename1>.jpeg
            │   └── <somename2>.jpeg
            └── ...
        :param model_save_path: (optional) path to save model on disk
        :param n_neighbors: (optional) number of neighbors to weigh in classification. Chosen automatically if not specified
        :param knn_algo: (optional) underlying data structure to support knn.default is ball_tree
        :param verbose: verbosity of training
        :return: returns knn classifier that was trained on the given data.
        """
        X = []
        y = []

        # Loop through each person in the training set
        for class_dir in os.listdir(train_dir):
            if not os.path.isdir(os.path.join(train_dir, class_dir)):
                continue

            # Loop through each training image for the current person
            for img_path in image_files_in_folder(os.path.join(train_dir, class_dir)):
                image = face_recognition.load_image_file(img_path)
                face_bounding_boxes = face_recognition.face_locations(image)

                if len(face_bounding_boxes) != 1:
                    # If there are no people (or too many people) in a training image, skip the image.
                    if verbose:
                        print("Image {} not suitable for training: {}".format(img_path, "Didn't find a face" if len(
                            face_bounding_boxes) < 1 else "Found more than one face"))
                else:
                    # Add face encoding for current image to the training set
                    X.append(face_recognition.face_encodings(
                        image, known_face_locations=face_bounding_boxes)[0])
                    y.append(class_dir)

        # Determine how many neighbors to use for weighting in the KNN classifier
        if n_neighbors is None:
            n_neighbors = int(round(math.sqrt(len(X))))
            if verbose:
                print("Chose n_neighbors automatically:", n_neighbors)

        # Create and train the KNN classifier
        knn_clf = neighbors.KNeighborsClassifier(
            n_neighbors=n_neighbors, algorithm=knn_algo, weights='distance')
        knn_clf.fit(X, y)

        # Save the trained KNN classifier
        if model_save_path is not None:
            with open(model_save_path, 'wb') as f:
                pickle.dump(knn_clf, f)

        return knn_clf

    def gen_frames(image):
        base64_string = image[23:]
        base64_bytes = base64.b64decode(base64_string)
        rgb = imread(io.BytesIO(base64_bytes))
        img = cv2.cvtColor(rgb, cv2.COLOR_RGB2BGR)
        # font = cv2.FONT_HERSHEY_SIMPLEX

        predictions = predict("hi", img, model_path="trained_knn_model.clf")
        # k = cv2.waitKey(100) & 0xff  # Press 'ESC' for exiting video
        # print(predictions)

        match = ""
        for name, (top, right, bottom, left) in predictions:
            if len(predictions) > 1 and predictions[0][0] == predictions[1][0]:
                match = "Match"
            if len(predictions) < 1:
                match = ""
            # cv2.rectangle(img, (top,bottom), (left,right), (255,0,0), 2)
            # ret, buffer = cv2.imencode('.jpg', img)
            # img = buffer.tobytes()
            
            return { 'name' : name, 'top' : top, 'bottom' : bottom, 'left' : left, 'right' : right }
            
            # cv2.putText(
            #         img, 
            #         str(name+match), 
            #         (left+5,bottom), 
            #         font, 
            #         0.5, 
            #         (255,255,0), 
            #         1
            #    )  
        # ret, buffer = cv2.imencode('.jpg', img)
        # img = buffer.tobytes()
        # yield (b'--frame\r\n'
        #         b'Content-Type: image/jpeg\r\n\r\n' + img + b'\r\n')  # concat frame one by one and show result
        # print("- Found {} at ({}, {})".format(name, left, top))

    def add_model(name, image, count):
        base64_string = image[23:]
        base64_bytes = base64.b64decode(base64_string)
        rgb = imread(io.BytesIO(base64_bytes))
        img = cv2.cvtColor(rgb, cv2.COLOR_RGB2BGR)

        parent_path = pathlib.Path('knn_examples').resolve()
        if (os.path.exists(parent_path) == False):
            os.mkdir(parent_path)
        path1 = os.path.join(parent_path, "train")
        if (os.path.exists(path1) == False):
            os.mkdir(path1)
        path = os.path.join(path1, name)
        if os.path.exists(path) == False:
            os.mkdir(path)
        
        fileName = os.path.join(path, str(name)+"_"+str(count)+".jpg")

        while (os.path.exists(fileName)):
            count+=1
            fileName = os.path.join(path, str(name)+"_"+str(count)+".jpg")

        cv2.imwrite(fileName , img)

def predict(X_img_path, faces,  knn_clf=None, model_path=None, distance_threshold=0.5):
    """
    Recognizes faces in given image using a trained KNN classifier
    :param X_img_path: path to image to be recognized
    :param knn_clf: (optional) a knn classifier object. if not specified, model_save_path must be specified.
    :param model_path: (optional) path to a pickled knn classifier. if not specified, model_save_path must be knn_clf.
    :param distance_threshold: (optional) distance threshold for face classification. the larger it is, the more chance
        of mis-classifying an unknown person as a known one.
    :return: a list of names and face locations for the recognized faces in the image: [(name, bounding box), ...].
        For faces of unrecognized persons, the name 'unknown' will be returned.
    """

    # Load a trained KNN model (if one was passed in)
    if knn_clf is None:
        with open(model_path, 'rb') as f:
            knn_clf = pickle.load(f)

    # Load image file and find face locations

    X_img = faces
    X_face_locations = face_recognition.face_locations(X_img)

    # If no faces are found in the image, return an empty result.
    if len(X_face_locations) == 0:
        return []

    # Find encodings for faces in the test iamge
    faces_encodings = face_recognition.face_encodings(
        X_img, known_face_locations=X_face_locations)

    # Use the KNN model to find the best matches for the test face
    closest_distances = knn_clf.kneighbors(faces_encodings, n_neighbors=1)
    # print(closest_distances[0][0][0])
    are_matches = [closest_distances[0][i][0] <=
        distance_threshold for i in range(len(X_face_locations))]

    # Predict classes and remove classifications that aren't within the threshold
    return [(pred, loc) if rec else ("unknown", loc) for pred, loc, rec in zip(knn_clf.predict(faces_encodings), X_face_locations, are_matches)]

