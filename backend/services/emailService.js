const nodemailer = require("nodemailer");

const createTransporter = () => {
  if (
    !process.env.SMTP_HOST ||
    !process.env.SMTP_USER ||
    !process.env.SMTP_PASSWORD
  ) {
    throw new Error(
      "Email service is not configured. Please set SMTP_HOST, SMTP_USER and SMTP_PASSWORD."
    );
  }

  return nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT) || 587,
    secure: Number(process.env.SMTP_PORT) === 465,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASSWORD,
    },
  });
};

const sendPasswordResetOTP = async (email, otp) => {
  // Make sure a verified sender is configured
  if (!process.env.SMTP_FROM_EMAIL) {
    throw new Error(
      "SMTP_FROM_EMAIL is not configured. Please add a verified Brevo sender email."
    );
  }

  const transporter = createTransporter();

  await transporter.sendMail({
    // IMPORTANT:
    // Use your verified Brevo sender, NOT SMTP_USER
    from: `"${process.env.SMTP_FROM_NAME || "Trading Journal"}" <${process.env.SMTP_FROM_EMAIL}>`,

    to: email,

    subject: "Trading Journal - Password Reset OTP",

    text: `Your Trading Journal password reset OTP is ${otp}. This OTP will expire in ${
      process.env.OTP_EXPIRES_MINUTES || 10
    } minutes.`,

    html: `
      <div style="
        font-family: Arial, sans-serif;
        max-width: 600px;
        margin: auto;
        padding: 30px;
        background: #ffffff;
      ">

        <h2 style="
          color: #10b981;
          margin-bottom: 20px;
        ">
          Trading Journal
        </h2>

        <p>
          You requested to reset your Trading Journal password.
        </p>

        <p>
          Your 6-digit verification code is:
        </p>

        <div style="
          font-size: 32px;
          font-weight: bold;
          letter-spacing: 8px;
          padding: 20px;
          background: #f1f5f9;
          text-align: center;
          border-radius: 10px;
          margin: 20px 0;
          color: #0f172a;
        ">
          ${otp}
        </div>

        <p>
          This code will expire in
          <strong>
            ${process.env.OTP_EXPIRES_MINUTES || 10} minutes
          </strong>.
        </p>

        <p>
          If you did not request a password reset, you can safely ignore
          this email.
        </p>

        <p style="
          color: #64748b;
          font-size: 13px;
          margin-top: 30px;
        ">
          Trading Journal Security Team
        </p>

      </div>
    `,
  });
};

module.exports = {
  sendPasswordResetOTP,
};