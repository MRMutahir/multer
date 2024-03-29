const express = require("express");
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const cors = require("cors");
// const { nanoid }  = require("nanoid")
const zlib = require("zlib");
const archiver = require("archiver");
const { createServer } = require("http");
const app = express();
const server = createServer(app);
const { Server } = require("socket.io");
const io = new Server(server, { cors: { origin: "*", methods: "*" } });

const port = process.env.PORT || 3001;
app.use(express.json());
app.use(cors());

const uploadDir = path.join(__dirname, "upload");

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}-${file.originalname}`);
  },
});
const upload = multer({ storage: storage });

app.post(
  "/photos/upload",
  upload.array("files", 20),
  async (req, res, next) => {
    // console.log(req.files);
    try {
      // Check if more than 2 files are uploaded
      if (req.files.length > 2) {
        // Filter out files that are already zip files
        const nonZipFiles = req.files.filter(
          (file) => !file.originalname.endsWith(".zip")
        );

        // Check if there are files to compress
        if (nonZipFiles.length > 0) {
          // Compress the files into a zip archive
          const zipFilePath = path.join(uploadDir, "archive.zip");
          const output = fs.createWriteStream(zipFilePath);
          const archive = archiver("zip", { zlib: { level: 9 } });

          archive.pipe(output);

          nonZipFiles.forEach((file) => {
            const filePath = path.join(uploadDir, file.filename);
            archive.file(filePath, { name: file.originalname });
          });

          archive.finalize();

          // Listen for the 'close' event to ensure the archive process is complete
          output.on("close", () => {
            // Respond with the path to the zip file
            res.status(200).json({
              message: "Files compressed into a zip archive",
              zipPath: zipFilePath,
            });

            // Remove uploaded files after the zip process is complete
            nonZipFiles.forEach((file) => {
              const filePath = path.join(uploadDir, file.filename);
              fs.unlinkSync(filePath);
            });
          });
        } else {
          res.status(200).send("All files are already zip files");
        }
      } else {
        res.status(200).send("Files uploaded successfully");
      }
    } catch (error) {
      console.error("Error:", error);
      res.status(500).send("Internal Server Error");
    }
  }
);

io.on("connection", (socket) => {
  console.log("a user connected");
  socket.on("usermessage", ({ message, userId }) => {
    io.emit("broadcastMessage", { message, userId });
  });

  // socket.on("file", ({ data, userId }) => {
  //   console.log(`here a file ${data} and user id ${userId}`);
  //   io.emit("broadcastfile", { data, userId });
  // });
});

app.get("/photos/download", (req, res) => {
  try {
    const files = req.query.files;

    // Create a zip file containing the specified files
    const zipFilePath = path.join(uploadDir, "download.zip");
    const output = fs.createWriteStream(zipFilePath);
    const archive = archiver("zip", { zlib: { level: 9 } });

    archive.pipe(output);

    files.forEach((file) => {
      const filePath = path.join(uploadDir, file);
      archive.file(filePath, { name: file });
    });

    archive.finalize();

    // Respond with the path to the zip file
    res.status(200).json({ zipPath: zipFilePath });
  } catch (error) {
    console.error("Error:", error);
    res.status(500).send("Internal Server Error");
  }
});

// app.get("/photos/files", (req, res) => {
//   try {
//     const directoryPath = path.resolve(uploadDir);
//     const files = fs.readdirSync(directoryPath);

//     // Return the list of files in the response
//     res.status(200).json({ files });

//     // Delete files after sending the response
//     deleteFiles(files);
//   } catch (error) {
//     console.error("Error:", error);
//     res.status(500).send("Internal Server Error");
//   }
// });

function deleteFiles(files) {
  try {
    // Delete each file in the "upload" folder
    files.forEach((file) => {
      const filePath = path.join(uploadDir, file);
      fs.unlinkSync(filePath);
      console.log(`Deleted file: ${filePath}`);
    });
  } catch (error) {
    console.error("Error deleting files:", error);
  }
}

// const directoryPath = path.resolve("./upload");
// const files = fs.readdirSync(directoryPath);
// files.forEach((file) => {
//   const filePath = path.join(directoryPath, file);
//   const stream = fs.createReadStream(filePath);

//   stream.on("data", (chunk) => {
//     console.log(chunk.toJSON());
//   });

//   stream.on("end", () => {
//     console.log(`Reading ${file} completed`);
//   });
// });

server.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
