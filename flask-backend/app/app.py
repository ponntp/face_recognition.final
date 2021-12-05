from flask import Flask, request
from flask_cors import CORS
from face_rec import FaceRec


app = Flask(__name__)
CORS(app)


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

@app.route('/test', methods=['POST','GET'])
def test():
    return "Working!"

if __name__ == '__main__':
    app.run()