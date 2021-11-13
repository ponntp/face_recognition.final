import React, { useState, styles} from 'react';
import axios from 'axios';
import Webcam from 'react-webcam';

const WebcamCapture = () => {
  const webcamRef = React.useRef(null);
  const videoConstraints = {
    width : { min: 640, ideal: 640, max: 640 },
    height : { min: 480, ideal: 480 },
    facingMode: 'user'
  };
  const[status, setStatus] = useState('')
  const[re, setRe] = useState()
  const[read, setRead] = useState(false)
  const[faceData, setFaceData] = useState({
    name: '',
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
  })
  const[name, setName] = useState("")

  const capture = React.useCallback(() => {
    const imageSrc = webcamRef.current.getScreenshot();
    console.log(`imageSrc = ${imageSrc}`)
                //for deployment, you should put your backend url / api
    axios.post('http://127.0.0.1:5000/api', {data : imageSrc})
    	  .then(res => {
      	  console.log(`response = ${res.data}`)
      	  setRe(res.data)
    })
    	  .catch(error => {
      	  console.log(`error = ${error}`)
    })
  }, 
   [webcamRef]
  );

  const train = React.useCallback(() => {
    setStatus('Train')
    setRe('training...')
    axios.get('http://127.0.0.1:5000/train')
        .then(res => {
          setRe(res.data)
    })
        .catch(error => {
          setRe(`error = ${error}`)
    })
  });

  const runGenFrame = React.useCallback(() => {
    if (read) {
      setRead(false)
      setStatus('GenFrame: stop')
    } else {
      setRead(true)
      setStatus('GenFrame: start')
    }
    while (read) {
      setTimeout(() => {  console.log("World!"); }, 5000);
      genFrame()
    }
  })

  const genFrame = React.useCallback(() => {
    setStatus('Gen Frame')
    var square = document.getElementById("square")
    var label = document.getElementById("label")
    const imageSrc = webcamRef.current.getScreenshot();
    axios.post('http://127.0.0.1:5000/genframe', {data : imageSrc})
        .then(res => {
          setRe("Complete!")
          setFaceData(res.data)
          square.style.borderStyle = "solid"
    })
        .catch(error => {
          square.style.borderStyle = ""
          setFaceData({name: ''})
          setRe(`error = ${error}`)
    })
  },[webcamRef]);

  const addModel = React.useCallback((event) => {
    const imageList = []
    var IMAGE_COUNT = 5

    for (var i=0; i<IMAGE_COUNT; i++) {
      const imageSrc = webcamRef.current.getScreenshot();
      imageList[i] = imageSrc
    }
    setStatus("Add Model")
    setRe('collecting model...')
    event.preventDefault()
    axios.post('http://127.0.0.1:5000/addmodel', {data: imageList, name: name})
        .then(res => {
          setRe(res.data)
    })
        .catch(error => {
          setRe(`error = ${error}`)
        })
  });

  const waifu = React.useCallback(() => {
    setStatus("Hoshimachi Sui-chan")
    setRe("Kyoumo Kawaii!!!!!")
    var square = document.getElementById("square")
    var label = document.getElementById("label")
    setFaceData({name: "Best Girl!", top: 128, bottom: 223, left: 270, right: 378})
    square.style.borderStyle = 'solid'  
  })

  return (
  <div>
    <div>
      <div
        id="square" 
        style={{
          position: 'absolute',
          borderColor: "red",
          borderStyle: '',
          top: `${faceData.top+50}px`,
          left: `${faceData.left+15}px`,
          width: `${faceData.right-faceData.left}px`,
          height: `${faceData.top}px`,
        }}
      />
      <p
        id="label"
        style={{
          position: 'absolute',
          color: 'red',
          top: `${faceData.bottom+50}px`,
          left: `${faceData.right}px`,
        }}
      >
        {faceData.name}
      </p>
      <Webcam
        hidden={false}
        style={{zIndex:-1}}
        audio = {false}
        height = {400}
        ref = {webcamRef}
        screenshotFormat = "image/jpeg"
        width = {550}
        videoConstraints = {videoConstraints}
      />
    </div>
    <div>
      <form onSubmit={addModel}>
        <input 
          placeholder="name..." 
          type="text" 
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
        <button type="submit">Add Model</button>
      </form>
      <button onClick={train}>Train</button>
      <button onClick={genFrame}>Gen frames</button>
      <button onClick={waifu} hidden={0}>Detect</button>
      <h2>Status: {status}</h2>
      <p>Return: {re}</p>
      <h3>Face Data:</h3>
      <p>Name: {faceData.name}</p>
      <h4>Position:</h4>
      <p>Top: {faceData.top} Bottom: {faceData.bottom}</p>
      <p>Left: {faceData.left} Right: {faceData.right}</p>
    </div>
  </div>
	);
  
};

export default WebcamCapture;