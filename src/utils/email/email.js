import nodemailer from 'nodemailer';

const createTransport = () => {
  return nodemailer.createTransport({
   
    service: 'gmail',
    auth: {
      user: process.env.EMAIL,
      pass: process.env.EMAIL_PASSWORD,
    },
  });
};

async function sendResetEmail({ to, resetUrl }) {
  const transporter = createTransport();
  const info = await transporter.sendMail({
    from: 'mohamedtealeb088@gmail.com' || '"No Reply" <no-reply@example.com>',
    to,
    subject: 'Password reset request',
    text: `You requested a password reset. Use the link below:\n\n${resetUrl}\n\nIf you didn't request it, ignore this email.`,
    html: `<p>You requested a password reset. Click the link below:</p>
           <p><a href="${resetUrl}">${resetUrl}</a></p>
           <p>If you didn't request it, ignore this email.</p>`,
  });
  return info;
}

export { sendResetEmail };