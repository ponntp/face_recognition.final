FROM python:3.9.7-bullseye

WORKDIR /app

COPY . /app

RUN pip install click
RUN pip install cmake
RUN pip install Pillow
RUN pip install dlib
RUN pip install face_recognition
RUN pip install Flask
RUN pip install Flask-Cors
RUN pip install scikit-learn
RUN pip install numpy
RUN pip install opencv-python-headless
RUN pip install imageio
RUN pip install uwsgi

CMD ["uwsgi", "app.ini"]