"use client";
import { useEffect, useState } from "react";
import io from "socket.io-client";
import axios from "axios";
import alphabet from "alphabet";
import { v4 as uuidv4 } from "uuid";
const Home = () => {
  const [files, setFiles] = useState([]);
  const [message, setmessage] = useState("");
  const [messagetextarea, setmessagetextarea] = useState("");
  const [recipientUserId, setRecipientUserId] = useState("");
  const [socket, setSocket] = useState(null);

  useEffect(() => {
    const uniqId = uuidv4();
    console.log(uniqId);

    const socket = io("http://localhost:3001");

    socket.on("connect", () => {
      console.log("Connected to the server");
    });

    socket.on("disconnect", () => {
      console.log("Disconnected from the server");
    });

    // Listen for broadcastMessage event for text messages
    socket.on("broadcastMessage", ({ message, userId }) => {
      console.log(`Received message '${message}' from user ${userId}`);
    });

    // Listen for broadcastfile event for file messages
    socket.on("broadcastfile", ({ data, userId }) => {
      console.log(`Received file message from user ${userId},${data}`);
    });

    setSocket(socket);

    return () => {
      // Clean up the socket connection when the component unmounts
      socket.disconnect();
    };
  }, []);

  const addFileFoo = async () => {
    // console.log(files, "files>>>>>>>>>>>>>>>>>>>");
    const userId = recipientUserId;

    try {
      const formData = new FormData();
      for (let i = 0; i < files.length; i++) {
        formData.append("files", files[i]);
      }
      console.log(formData, ">>>>>>>>>>>>>>>>>>formData");
      const response = await axios.post(
        "http://localhost:3001/photos/upload",
        formData
      );
      // console.log(response.data);
      // console.log(response);
      // console.log(files);

      socket.emit("file", { data: files, userId: userId });
    } catch (error) {
      console.error("Error uploading files:", error);
    }
  };

  const addtextMessageFoo = () => {
    console.log(message, "message>>>>>>>>>>");
    const userId = recipientUserId;
    // Emit the "usermessage" event with both the message and user ID
    socket.emit("usermessage", { message: message || messagetextarea, userId });
  };

  return (
    <div>
      <h1>Real-Time File Sharing</h1>
      <input
        type="text"
        className="border"
        placeholder="Recipient User ID"
        value={recipientUserId}
        onChange={(e) => setRecipientUserId(e.target.value)}
      />
      <form className="bg-red-300  p-16">
        <label htmlFor="fileInput">Select a file to share:</label>
        <input
          type="file"
          id="fileInput"
          multiple
          onChange={(e) => setFiles(e.target.files)}
        />
        <br />

        <button
          type="button"
          className="bg-black  text-white rounded-sm  p-5"
          onClick={addFileFoo}
        >
          Send File
        </button>
      </form>
      <hr />

      <form className="bg-yellow-300 p-16 mt-10">
        <label htmlFor="fileInput">Write a text to share:</label>

        <div>
          <h4>message</h4>
          <input
            type="text"
            placeholder="message"
            onChange={(e) => setmessage(e.target.value)}
          />
        </div>
        <div>
          {" "}
          <h4>message</h4>
          <textarea
            className="textareamessage"
            onChange={(e) => setmessagetextarea(e.target.value)}
          ></textarea>
        </div>

        <button
          onClick={addtextMessageFoo}
          className="bg-black  text-white rounded-sm  p-5"
        >
          Send Message
        </button>
      </form>
    </div>
  );
};

export default Home;
