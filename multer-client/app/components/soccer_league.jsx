"use client";
import React, { useState } from "react";
import axios from "axios";

const CreateTeamForm = () => {
  const [teamName, setTeamName] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const handleSubmit = async (event) => {
    event.preventDefault();

    try {
      // Send a POST request to the backend API endpoint using Axios
      const response = await axios.post(
        "https://ill-teal-dragonfly-wear.cyclic.app/api/team",
        {
          name: teamName,
        },
        (withCredentials = true)
      );

      if (response.status === 201) {
        // If the request is successful, display success message
        setSuccessMessage(response.data.message);
        // Clear the form field
        setTeamName("");
      }
    } catch (error) {
      if (error.response) {
        // If the server responds with an error message
        setErrorMessage(error.response.data.error);
      } else {
        // If there's a network error or other unexpected error
        setErrorMessage("An error occurred. Please try again later.");
      }
    }
  };

  return (
    <div>
      <h2>Create Team</h2>
      {errorMessage && <p style={{ color: "red" }}>{errorMessage}</p>}
      {successMessage && <p style={{ color: "green" }}>{successMessage}</p>}
      <form onSubmit={handleSubmit} className="bg-cyan-300 p-10 rounded-2xl">
        <div>
          <label htmlFor="teamName">Team Name:</label>
          <input
            type="text"
            id="teamName"
            value={teamName}
            onChange={(e) => setTeamName(e.target.value)}
            required
          />
        </div>
        <button type="submit" className="p-5 bg-blue-300 text-white rounded-xl">
          Create Team
        </button>
      </form>
    </div>
  );
};

export default CreateTeamForm;
