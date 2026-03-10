document.addEventListener("DOMContentLoaded", () => {
  const activitiesList = document.getElementById("activities-list");
  const activitySelect = document.getElementById("activity");
  const signupForm = document.getElementById("signup-form");
  const messageDiv = document.getElementById("message");

  // Function to fetch activities from API
  async function fetchActivities() {
    try {
      const response = await fetch("/activities");
      const activities = await response.json();

      // Clear loading message
      activitiesList.innerHTML = "";

      // Populate activities list
      Object.entries(activities).forEach(([name, details]) => {
        const activityCard = document.createElement("div");
        activityCard.className = "activity-card";

        const spotsLeft = details.max_participants - details.participants.length;
        const participantsMarkup = details.participants.length > 0
          ? `<ul class="participants-list">${details.participants
              .map((p) =>
                `<li class="participant-item"><span>${p}</span><button class="participant-remove" data-activity="${encodeURIComponent(name)}" data-email="${encodeURIComponent(p)}" aria-label="Remove participant">✕</button></li>`
              )
              .join('')}</ul>`
          : `<p class="empty">No participants yet.</p>`;

        activityCard.innerHTML = `
          <h4>${name}</h4>
          <p>${details.description}</p>
          <p><strong>Schedule:</strong> ${details.schedule}</p>
          <p><strong>Availability:</strong> ${spotsLeft} spots left</p>
          <div class="participants">
            <strong>Participants (${details.participants.length}):</strong>
            ${participantsMarkup}
          </div>
        `;

        activitiesList.appendChild(activityCard);

        // Attach delete handlers to participant remove buttons
        activityCard.querySelectorAll('.participant-remove').forEach((button) => {
          button.addEventListener('click', async () => {
            const activityValue = decodeURIComponent(button.dataset.activity);
            const participantEmail = decodeURIComponent(button.dataset.email);
            try {
              const removeResponse = await fetch(
                `/activities/${encodeURIComponent(activityValue)}/participants?email=${encodeURIComponent(participantEmail)}`,
                { method: 'DELETE' }
              );
              const removeResult = await removeResponse.json();
              if (removeResponse.ok) {
                messageDiv.textContent = removeResult.message;
                messageDiv.className = 'success';
                messageDiv.classList.remove('hidden');
                setTimeout(() => messageDiv.classList.add('hidden'), 5000);
                await fetchActivities();
              } else {
                messageDiv.textContent = removeResult.detail || 'Failed to remove participant';
                messageDiv.className = 'error';
                messageDiv.classList.remove('hidden');
              }
            } catch (error) {
              messageDiv.textContent = 'Failed to remove participant. Please try again.';
              messageDiv.className = 'error';
              messageDiv.classList.remove('hidden');
              console.error('Error removing participant:', error);
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
        messageDiv.textContent = result.message;
        messageDiv.className = "success";
        signupForm.reset();
        await fetchActivities();
      } else {
        messageDiv.textContent = result.detail || "An error occurred";
        messageDiv.className = "error";
      }

      messageDiv.classList.remove("hidden");

      // Hide message after 5 seconds
      setTimeout(() => {
        messageDiv.classList.add("hidden");
      }, 5000);
    } catch (error) {
      messageDiv.textContent = "Failed to sign up. Please try again.";
      messageDiv.className = "error";
      messageDiv.classList.remove("hidden");
      console.error("Error signing up:", error);
    }
  });

  // Initialize app
  fetchActivities();
});
