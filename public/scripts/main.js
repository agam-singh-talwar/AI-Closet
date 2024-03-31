let detectLocation = document.getElementById("detectLocation");

// Detects latitude and longitude from browser
detectLocation.addEventListener("click", async (e) => {
    let name = document.getElementById("account-name").value;
    let email = document.getElementById("account-email").value;

    if ("geolocation" in navigator) {
        navigator.geolocation.getCurrentPosition(function (position) {
            const latitude = position.coords.latitude;
            const longitude = position.coords.longitude;
            window.location.href = `/account?lat=${latitude}&lon=${longitude}&name=${name}&email=${email}`;
        }, function (error) {
            switch (error.code) {
                case error.PERMISSION_DENIED:
                    console.error("User denied the request for geolocation.");
                    break;
                case error.POSITION_UNAVAILABLE:
                    console.error("Location information is unavailable.");
                    break;
                case error.TIMEOUT:
                    console.error("The request to get user location timed out.");
                    break;
                case error.UNKNOWN_ERROR:
                    console.error("Ooops something is wrong.");
                    break;
            }
        });
    } else {
        console.error("Geolocation is not available in this browser.");
    }
});