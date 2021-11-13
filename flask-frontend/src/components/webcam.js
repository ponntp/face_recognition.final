import React, { useState, styles} from 'react';
import axios from 'axios';
import Webcam from 'react-webcam';
import ReactDOM from 'react-dom';

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
  const[matching,setMatching] = useState("")

  const train = React.useCallback(() => {
    setStatus('Train Model')
    setName('')
    setRe('training...')
    axios.get('http://127.0.0.1:5000/train')
        .then(res => {
          setRe(res.data)
    })
        .catch(error => {
          setRe("Error: Model not found or incompatible")
    })
  });

  // const runGenFrame = React.useCallback(() => {
  //   if (read) {
  //     setRead(false)
  //     setStatus('GenFrame: stop')
  //   } else {
  //     setRead(true)
  //     setStatus('GenFrame: start')
  //   }
  // })

  const genFrame = React.useCallback(() => {
    setStatus('Detect')
    setMatching('')
    const imageSrc = webcamRef.current.getScreenshot();
    var frameContainer = []
    axios.post('http://127.0.0.1:5000/genframe', {data : imageSrc})
        .then(res => {
          if (res.data['name'].length === 0) {
            setRe("face_not_found")
          } else {
            frameContainer = createFrameDiv(res.data)

            ReactDOM.render(
              frameContainer,
              document.getElementById('frame')
            )
            setRe("found['"+res.data['name']+"']")
            
            if (res.data['name'].length > 1) {
              if (res.data['name'][0] === res.data['name'][1]) {
                setMatching('MATCH')
              } else {
                setMatching('UNMATCH')
              }
            }
          }
          
    })
        .catch(error => {
          setRe(`error = ${error}`)
          // setRe("face_not_found")
    })
  },[webcamRef]);

  function createFrameDiv(data) {
    const frameList = []
    const labelList = []
    var fullList = []
    for (var i=0; i<data['name'].length; i++) {
      const frame = React.createElement('div', 
                                      {style: {
                                        position: 'absolute',
                                        borderColor: "red",
                                        borderStyle: 'solid',
                                        top: (data['top'][i]+50)+"px",
                                        left: (data['left'][i]+15)+"px",
                                        width: (data['right'][i]-data['left'][i])+"px",
                                        height: (data['bottom'][i]-data['top'][i])+"px",
                                        }
                                      })
      const label = React.createElement('p', 
                                      {id: "label"+i
                                        ,style: {
                                        position: 'absolute',
                                        color: 'red',
                                        top: (data['bottom'][i]+50)+"px",
                                        left: (data['right'][i])+"px",
                                      }
                                    }, data['name'][i])                                       
      frameList[i] = frame
      labelList[i] = label
    }
    fullList = [new Set([frameList, labelList])]
    const frameContainer = React.createElement('div',{id: "frameContainer"},fullList)
    return frameContainer

  }

  const addModel = React.useCallback((event) => {
    const imageList = []
    var IMAGE_COUNT = 5

    setStatus("Add Model")
    event.preventDefault()
  
    if (name==='') {
      setRe("Error: Name cannot be empty")
    } else {
      setRe("collecting model...")
      for (var i=0; i<IMAGE_COUNT; i++) {
        const imageSrc = webcamRef.current.getScreenshot();
        imageList[i] = imageSrc
      } 
      axios.post('http://127.0.0.1:5000/addmodel', {data: imageList, name: name})
          .then(res => {
            setRe(res.data)
      })
          .catch(error => {
            setRe(`error = ${error}`)
      })
    }
  });

  return (
  <div>
    <div>
      <div id="frame">
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
      </div>
      
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
      <button onClick={genFrame}>Detect</button>
      <h2>Menu: {status}</h2>
      <p>Status: {re}</p>
      {/* <h3>Face Data:</h3>
      <p>Name: {faceData.name}</p> */}
      {/* <h4>Position:</h4>
      <p>Top: {faceData.top} Bottom: {faceData.bottom}</p>
      <p>Left: {faceData.left} Right: {faceData.right}</p> */}
      <p style={{color: "red", fontSize: "20px"}}>{matching}</p>
    </div>
  </div>
	);
  
};

export default WebcamCapture;