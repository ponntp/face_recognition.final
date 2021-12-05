import React, { useState, StyleSheet, useEffect } from "react";
import axios from "axios";
import Webcam from "react-webcam";
import ReactDOM from "react-dom";
import "./styles.css";
import logo from "./manual.png";

const WebcamCapture = () => {
  const webcamRef = React.useRef(null);
  const videoConstraints = {
    width: { min: 640, ideal: 640, max: 640 },
    height: { min: 480, ideal: 480 },
    facingMode: "user",
  };
  const [status, setStatus] = useState("");
  const [re, setRe] = useState();
  const [faceData, setFaceData] = useState({
    name: "",
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
  });
  const [name, setName] = useState("");
  const [matching, setMatching] = useState("");

  const[url,setUrl] = useState(`/api/`)
  // const [url, setUrl] = useState(`http://127.0.0.1:5000/`);

  const train = React.useCallback(() => {
    setStatus("training...");
    setName("");
    axios
      .get(url + "/train")
      .then((res) => {
        setStatus(res.data);
      })
      .catch((error) => {
        setStatus("Error: Model not found or incompatible");
      });
  });

  const genFrame = React.useCallback(() => {
    setMatching("");
    const imageSrc = webcamRef.current.getScreenshot();
    var frameContainer = [];
    axios
      .post(url + "/genframe", { data: imageSrc })
      .then((res) => {
        if (res.data["name"].length === 0) {
          frameContainer = createFrameDiv({
            name: [],
            top: [0],
            bottom: [0],
            left: [0],
            right: [0],
          });
          ReactDOM.render(frameContainer, document.getElementById("frame"));
          setRe("Face not found");
        } else {
          frameContainer = createFrameDiv(res.data);

          ReactDOM.render(frameContainer, document.getElementById("frame"));
          setRe(  res.data["name"]+"," );

          if (res.data["name"].length > 1) {
            if (res.data["name"][0] === res.data["name"][1]) {
              setMatching(" MATCH! ");
            } else {
              setMatching(" UNMATCH! ");
            }
          }
        }
      })
      .catch((error) => {
        setRe(`error = ${error}`);
        // setRe("face_not_found")
      });
  }, [webcamRef]);

  function createFrameDiv(data) {
    const frameList = [];
    const labelList = [];
    var fullList = [];
    for (var i = 0; i < data["name"].length; i++) {
      const frame = React.createElement("div", {
        style: {
          position: "absolute",
          borderColor: "#49FF00",
          borderStyle: "solid",
          top: data["top"][i] + 50 + "px",
          left: data["left"][i] + 15 + "px",
          width: data["right"][i] - data["left"][i] + "px",
          height: data["bottom"][i] - data["top"][i] + "px",
        },
      });
      const label = React.createElement(
        "p",
        {
          id: "label" + i,
          style: {
            fontSize: "25px",
            position: "absolute",
            color: "#49FF00",
            top: data["bottom"][i]  +25+ "px",
            left: data["left"][i]  +25+"px",
            
          },
        },
        data["name"][i]
      );
      frameList[i] = frame;
      labelList[i] = label;
    }
    fullList = [new Set([frameList, labelList])];
    const frameContainer = React.createElement(
      "div",
      { id: "frameContainer" },
      fullList
    );
    return frameContainer;
  }

  const addModel = React.useCallback((event) => {
    const imageList = [];
    var IMAGE_COUNT = 5;

    setStatus("Add Model");
    event.preventDefault();

    if (name === "") {
      setStatus("Error: Name cannot be empty");
    } else {
      setStatus("collecting model...");
      for (var i = 0; i < IMAGE_COUNT; i++) {
        const imageSrc = webcamRef.current.getScreenshot();
        imageList[i] = imageSrc;
      }
      axios
        .post(url + "/addmodel", { data: imageList, name: name })
        .then((res) => {
          setStatus(res.data);
        })
        .catch((error) => {
          setStatus(`error = ${error}`);
        });
    }
  });

  const test = React.useCallback(() => {
    setStatus("Test...");

    axios
      .post(url + "/test", { data: "test" })
      .then((res) => {
        setStatus(res.data);
      })
      .catch((error) => {
        setStatus(`error = ${error}`);
      });
  });

  const runGenFrame = async () => {
    setInterval(() => {
      genFrame();
    }, 1000);
  };

  useEffect(() => {
    runGenFrame();
  }, []);

  return (
    <div>
      <div className="row">
        <div className="column">
          <div id="frame">
            <p
              id="label"
              style={{
                position: "absolute",
                color: "red",
                top: `${faceData.bottom + 50}px`,
                left: `${faceData.right}px`,
              }}
            >
              {faceData.name}
            </p>
          </div>
          <Webcam
            hidden={false}
            style={{
              zIndex: -1,
              backgroundColor: "#fff",
              padding: "15px",
              border: "5px solid #FF5403",
            }}
            audio={false}
            height={400}
            ref={webcamRef}
            screenshotFormat="image/jpeg"
            width={550}
            videoConstraints={videoConstraints}
          />
        </div>

        <div className="column">
          <img style={{width: "65%",marginLeft: "115px",marginTop: "10px"}}src={logo} />
        </div>

        <div
          className="column"
          style={{
            backgroundColor: "#fff",
            padding: "15px",
            marginTop: "10px",
            width: "500px",
            height: "400px",
            border: "5px solid #FF5403",
         
          }}
        >
          <form onSubmit={addModel}>
            <input
              className="Input"
              placeholder="Input your name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          
          </form>
          <button className="ButtonAdd" onClick={addModel} type="submit" >
              Add Face
            </button>
          
          <button className="ButtonTrain" onClick={train}>
            Register Face
          </button>
          {/* <button onClick={genFrame}>Detect</button> */}
          {/*<button className="ButtonTest" onClick={test}>
                Test
                      </button>*/}
          <h2 className="Status"> STATUS: {status}</h2>
          <h2 className="Detect">DETECT: {re}</h2>
          <h6 className="MatchingText">{matching}</h6>
        </div>
      </div>
    </div>
  );
};

export default WebcamCapture;
