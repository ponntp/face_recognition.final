from flask import Flask, request, Response
from flask_cors import CORS
import json
from face_rec import FaceRec
from PIL import Image
import base64
import io
import os
import shutil
import time
import cv2
import numpy as np
from imageio import imread

app = Flask(__name__)
CORS(app)

@app.route('/test', methods=['POST', 'GET'])
def test():
    data = request.get_json()
    if (data['data'] == False):
        resp = FaceRec.getTxt()
    else:
        resp = FaceRec.getTxt2()

    return resp

@app.route('/train', methods=['GET'])
def train():
    classifier = FaceRec.train("knn_examples/train", model_save_path="trained_knn_model.clf", n_neighbors=2)
    # print(classifier)
    return 'Training Complete!'

@app.route('/genframe', methods=['POST','GET'])
def genFrame():
    data = request.get_json()['data']

    resp = FaceRec.gen_frames(data)
    print(resp)
    return resp

@app.route('/addmodel', methods=['POST','GET'])
def addModel():
    data = request.get_json()['data']
    name = request.get_json()['name']
    count = 0

    for image in data:
        FaceRec.add_model(name, image, count)
        count+=1

    return "Complete!"

if __name__ == '__main__':
    app.run()