const truecallerjs = require("truecallerjs");

async function performLogin() {
    try {
        const phoneNumber = "+917254880990";
        const json_data = await truecallerjs.login(phoneNumber);
        console.log(json_data);

        // Example response handling
        if (json_data.status === 1 || json_data.status === 9) {
            console.log("✅ OTP sent successfully");
            console.log("Request ID:", json_data.requestId);
            console.log("Token TTL:", json_data.tokenTtl);
        } else if (json_data.status === 6 || json_data.status === 5) {
            console.log("❌ Verification attempts exceeded");
            console.log("Status:", json_data.status);
            console.log("Message:", json_data.message);
        } else {
            console.log("❓ Unknown response");
            console.log("Status:", json_data.status);
            console.log("Message:", json_data.message);
        }
    } catch (error) {
        console.error("🚨 Error occurred:", error);
    }
}

performLogin();
