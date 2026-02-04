import { logger } from "devdad-express-utils";
import "dotenv/config";
import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

export const sendMail = async (to, subject, html) => {
  try {
    // await transporter.sendMail({
    //   from: process.env.SMTP_FROM,
    //   to,
    //   subject,
    //   html,
    // });

    await resend.emails.send({
      from: process.env.RESEND_FROM,
      to,
      subject,
      html,
    });
    return true;
  } catch (error) {
    logger.error(error.msg || "Sending email failed", { error });
    throw error;
  }
};
