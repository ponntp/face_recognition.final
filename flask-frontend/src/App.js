import React, { Component } from "react";
import Webcam from "react-webcam";
import WebcamCapture from "./components/webcam.js";
import "./components/styles2.css"

class App extends Component {
  render() {
    return (
      <div>
        
          <p className="Title">Face Recognition  </p>
      
        <WebcamCapture />
      </div>
    );
  }
}

export default App;