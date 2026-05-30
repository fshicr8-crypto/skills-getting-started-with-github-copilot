document.addEventListener("DOMContentLoaded", () => {
  const activitiesList = document.getElementById("activities-list");
  const activitySelect = document.getElementById("activity");
  const signupForm = document.getElementById("signup-form");
  const messageDiv = document.getElementById("message");
  let messageTimeout;

  function showMessage(text, type) {
    if (messageTimeout) {
      clearTimeout(messageTimeout);
    }

    messageDiv.textContent = text;
    messageDiv.className = type;
    messageDiv.classList.remove("hidden");

    messageTimeout = setTimeout(() => {
      messageDiv.classList.add("hidden");
    }, 5000);
  }

  // Function to fetch activities from API
  async function fetchActivities() {
    try {
      const response = await fetch("/activities");
      const activities = await response.json();

      // Clear loading message and activity dropdown
      activitiesList.innerHTML = "";
      activitySelect.innerHTML = `<option value="">-- Select an activity --</option>`;

      // Populate activities list
      Object.entries(activities).forEach(([name, details]) => {
        const activityCard = document.createElement("div");
        activityCard.className = "activity-card";

        const spotsLeft = details.max_participants - details.participants.length;
        const participants = details.participants || [];
        const participantsHtml = participants.length
          ? `
            <div class="participants">
              <strong>Participants</strong>
              <ul>
                ${participants
                  .map(
                    (email) =>
                      `<li class="participant-item"><span>${email}</span><button type="button" class="participant-remove-btn" data-activity="${name}" data-email="${email}" title="Unregister ${email}">✕</button></li>`
                  )
                  .join("")}
              </ul>
            </div>
          `
          : `
            <div class="participants empty">
              <strong>Participants</strong>
              <p>No participants yet</p>
            </div>
          `;

        activityCard.innerHTML = `
          <h4>${name}</h4>
          <p>${details.description}</p>
          <p><strong>Schedule:</strong> ${details.schedule}</p>
          <p><strong>Availability:</strong> ${spotsLeft} spots left</p>
          ${participantsHtml}
        `;

        activitiesList.appendChild(activityCard);

        activityCard.querySelectorAll(".participant-remove-btn").forEach((button) => {
          button.addEventListener("click", async () => {
            const activityName = button.dataset.activity;
            const participantEmail = button.dataset.email;

            try {
              const deleteResponse = await fetch(
                `/activities/${encodeURIComponent(activityName)}/participants?email=${encodeURIComponent(participantEmail)}`,
                {
                  method: "DELETE",
                }
              );
              const deleteResult = await deleteResponse.json();

              if (deleteResponse.ok) {
                showMessage(deleteResult.message, "success");
                await fetchActivities();
              } else {
                showMessage(deleteResult.detail || "Could not unregister participant", "error");
              }
            } catch (deleteError) {
              showMessage("Failed to unregister participant. Please try again.", "error");
              console.error("Error deleting participant:", deleteError);
            }
          });
        });

        // Add option to select dropdown
        const option = document.createElement("option");
        option.value = name;
        option.textContent = name;
        activitySelect.appendChild(option);
      });
    } catch (error) {
      activitiesList.innerHTML = "<p>Failed to load activities. Please try again later.</p>";
      console.error("Error fetching activities:", error);
    }
  }

  // Handle form submission
  signupForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const email = document.getElementById("email").value;
    const activity = document.getElementById("activity").value;

    try {
      const response = await fetch(
        `/activities/${encodeURIComponent(activity)}/signup?email=${encodeURIComponent(email)}`,
        {
          method: "POST",
        }
      );

      const result = await response.json();

      if (response.ok) {
        showMessage(result.message, "success");
        signupForm.reset();
        await fetchActivities();
      } else {
        showMessage(result.detail || "An error occurred", "error");
      }
    } catch (error) {
      showMessage("Failed to sign up. Please try again.", "error");
      console.error("Error signing up:", error);
    }
  });

  // Initialize app
  fetchActivities();
});
