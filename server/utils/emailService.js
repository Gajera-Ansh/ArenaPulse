import nodemailer from 'nodemailer';

export const sendOTPEmail = async (userEmail, userName, otp) => {
  try {
    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
      console.warn("EMAIL_USER or EMAIL_PASS not configured. Skipping OTP email to", userEmail);
      return;
    }

    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || 'smtp.gmail.com',
      port: process.env.SMTP_PORT || 587,
      secure: process.env.SMTP_SECURE === 'true',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    const htmlContent = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>ArenaPulse Password Reset OTP</title>
      <style>
        body { margin: 0; padding: 0; background-color: #0F172A; font-family: 'Inter', sans-serif; color: #f1f5f9; }
        .container { max-width: 600px; margin: 0 auto; background-color: #1E293B; border-radius: 12px; overflow: hidden; margin-top: 40px; margin-bottom: 40px; border: 1px solid #334155; }
        .header { background: linear-gradient(135deg, #fbbf24 0%, #d97706 100%); padding: 30px 20px; text-align: center; }
        .header h1 { margin: 0; color: #0F172A; font-size: 28px; font-weight: 800; text-transform: uppercase; letter-spacing: 2px; }
        .content { padding: 40px 30px; text-align: center; }
        .otp-box { background-color: #0F172A; border: 1px dashed #fbbf24; border-radius: 8px; padding: 20px; margin: 20px auto; display: inline-block;}
        .otp-code { font-size: 32px; font-weight: 800; color: #fbbf24; letter-spacing: 4px; margin: 0; }
        .footer { padding: 20px; text-align: center; font-size: 12px; color: #64748b; border-top: 1px solid #334155; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>ArenaPulse</h1>
        </div>
        <div class="content">
          <p style="font-size: 20px; font-weight: 600; margin-bottom: 20px;">Hello, ${userName}!</p>
          <p style="color: #94a3b8; font-size: 16px; margin-bottom: 20px;">You requested a password change. Use the OTP code below to verify your request.</p>
          <div class="otp-box">
            <h2 class="otp-code">${otp}</h2>
          </div>
          <p style="color: #94a3b8; font-size: 14px; margin-top: 20px;">This code will expire in 2 minutes. If you did not request this change, please ignore this email.</p>
        </div>
        <div class="footer">
          &copy; ${new Date().getFullYear()} ArenaPulse Esports. All rights reserved.
        </div>
      </div>
    </body>
    </html>
    `;

    await transporter.sendMail({
      from: '"ArenaPulse" <' + process.env.EMAIL_USER + '>',
      to: userEmail,
      subject: 'Your Password Reset OTP - ArenaPulse',
      html: htmlContent,
    });
    console.log("OTP email sent successfully to", userEmail);
  } catch (error) {
    console.error("Error sending OTP email:", error);
  }
};

export const sendTeamInvitationEmail = async (userEmail, userName, captainName, teamName, teamTag) => {
  try {
    // Check if SMTP is configured
    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
      console.warn("EMAIL_USER or EMAIL_PASS is not configured in .env. Skipping invitation email to", userEmail);
      return;
    }

    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || 'smtp.gmail.com',
      port: process.env.SMTP_PORT || 587,
      secure: process.env.SMTP_SECURE === 'true',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    const loginUrl = process.env.CLIENT_URL ? `${process.env.CLIENT_URL}/login` : 'https://arena-pulse-pi.vercel.app/login';

    const htmlContent = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>ArenaPulse Team Invitation</title>
      <style>
        body { margin: 0; padding: 0; background-color: #0F172A; font-family: 'Inter', 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; color: #f1f5f9; }
        .container { max-width: 600px; margin: 0 auto; background-color: #1E293B; border-radius: 12px; overflow: hidden; margin-top: 40px; margin-bottom: 40px; border: 1px solid #334155; }
        .header { background: linear-gradient(135deg, #fbbf24 0%, #d97706 100%); padding: 30px 20px; text-align: center; }
        .header h1 { margin: 0; color: #0F172A; font-size: 28px; font-weight: 800; text-transform: uppercase; letter-spacing: 2px; }
        .content { padding: 40px 30px; text-align: center; }
        .greeting { font-size: 20px; font-weight: 600; margin-bottom: 20px; color: #f8fafc; }
        .message { font-size: 16px; line-height: 1.6; color: #94a3b8; margin-bottom: 30px; }
        .team-box { background-color: #0F172A; border: 1px dashed #fbbf24; border-radius: 8px; padding: 20px; margin-bottom: 30px; }
        .team-name { font-size: 24px; font-weight: 800; color: #fbbf24; margin: 0; }
        .team-tag { font-size: 14px; color: #cbd5e1; text-transform: uppercase; letter-spacing: 1px; margin-top: 5px; }
        .btn { display: inline-block; background-color: #fbbf24; color: #0F172A !important; text-decoration: none; font-size: 16px; font-weight: 700; padding: 14px 32px; border-radius: 8px; text-transform: uppercase; letter-spacing: 1px; transition: background-color 0.3s ease; }
        .btn:hover { background-color: #f59e0b; }
        .footer { padding: 20px; text-align: center; font-size: 12px; color: #64748b; border-top: 1px solid #334155; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>ArenaPulse</h1>
        </div>
        <div class="content">
          <div class="greeting">Incoming Draft Request!</div>
          <div class="message">
            Hello <strong>${userName}</strong>,<br><br>
            You have been recruited by Captain <strong>${captainName}</strong> to join their competitive roster.
          </div>
          
          <div class="team-box">
            <h2 class="team-name">${teamName}</h2>
            <div class="team-tag">[${teamTag}]</div>
          </div>
          
          <div class="message">
            Log in to your ArenaPulse dashboard to review and accept this deployment request.
          </div>
          
          <a href="${loginUrl}" class="btn">View Invitation</a>
        </div>
        <div class="footer">
          &copy; ${new Date().getFullYear()} ArenaPulse Esports. All rights reserved.<br>
          If you didn't expect this invitation, you can safely ignore this email.
        </div>
      </div>
    </body>
    </html>
    `;

    const mailOptions = {
      from: `"ArenaPulse" <${process.env.EMAIL_USER}>`,
      to: userEmail,
      subject: `Draft Request: Join ${teamName} [${teamTag}]`,
      html: htmlContent,
    };

    await transporter.sendMail(mailOptions);
    return true;
  } catch (error) {
    console.error('[Email Service] Error sending invitation email:', error);
    return false;
  }
};

export const sendTournamentEnrollmentEmail = async (userEmail, userName, captainName, teamName, tournamentName) => {
  try {
    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) return false;

    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || 'smtp.gmail.com',
      port: process.env.SMTP_PORT || 587,
      secure: process.env.SMTP_SECURE === 'true',
      auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS },
    });

    const loginUrl = process.env.CLIENT_URL ? `${process.env.CLIENT_URL}/dashboard` : 'https://arena-pulse-pi.vercel.app/dashboard';

    const htmlContent = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <style>
        body { margin: 0; padding: 0; background-color: #0F172A; font-family: 'Inter', sans-serif; color: #f1f5f9; }
        .container { max-width: 600px; margin: 40px auto; background-color: #1E293B; border-radius: 12px; overflow: hidden; border: 1px solid #334155; }
        .header { background: linear-gradient(135deg, #fbbf24 0%, #d97706 100%); padding: 30px; text-align: center; }
        .header h1 { margin: 0; color: #0F172A; font-size: 24px; font-weight: 800; text-transform: uppercase; letter-spacing: 1px; }
        .content { padding: 40px 30px; text-align: center; }
        .greeting { font-size: 18px; font-weight: 600; margin-bottom: 20px; color: #f8fafc; }
        .message { font-size: 15px; line-height: 1.6; color: #94a3b8; margin-bottom: 30px; }
        .box { background-color: #0F172A; border: 1px dashed #fbbf24; border-radius: 8px; padding: 20px; margin-bottom: 30px; }
        .t-name { font-size: 20px; font-weight: 800; color: #fbbf24; margin: 0; }
        .btn { display: inline-block; background-color: #fbbf24; color: #0F172A !important; text-decoration: none; font-size: 16px; font-weight: 700; padding: 14px 32px; border-radius: 8px; text-transform: uppercase; }
        .footer { padding: 20px; text-align: center; font-size: 12px; color: #64748b; border-top: 1px solid #334155; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header"><h1>ArenaPulse Enrollment</h1></div>
        <div class="content">
          <div class="greeting">Tournament Enrollment Request!</div>
          <div class="message">
            Hello <strong>${userName}</strong>,<br><br>
            Captain <strong>${captainName}</strong> wants to enroll your team <strong>${teamName}</strong> into a new tournament!
          </div>
          <div class="box">
            <h2 class="t-name">${tournamentName}</h2>
          </div>
          <div class="message">Log in to your Dashboard to confirm you are available to play. If anyone on the team declines, the registration is aborted.</div>
          <a href="${loginUrl}" class="btn">Review Enrollment</a>
        </div>
        <div class="footer">&copy; ${new Date().getFullYear()} ArenaPulse Esports.</div>
      </div>
    </body>
    </html>
    `;

    const mailOptions = {
      from: `"ArenaPulse" <${process.env.EMAIL_USER}>`,
      to: userEmail,
      subject: `Enrollment Request: ${teamName} entering ${tournamentName}`,
      html: htmlContent,
    };

    await transporter.sendMail(mailOptions);
    return true;
  } catch (error) {
    console.error('[Email Service] Error sending enrollment email:', error);
    return false;
  }
};

export const sendRegistrationStatusEmail = async (userEmails, teamName, tournamentName, status) => {
  try {
    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) return false;

    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || 'smtp.gmail.com',
      port: process.env.SMTP_PORT || 587,
      secure: process.env.SMTP_SECURE === 'true',
      auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS },
    });

    const isApproved = status === 'approved';
    const color = isApproved ? '#22c55e' : '#ef4444';
    const title = isApproved ? 'Registration Approved' : 'Registration Rejected';
    const msg = isApproved 
      ? `Good news! The organizer has approved your team <strong>${teamName}</strong> for the tournament!`
      : `Unfortunately, the organizer has rejected your team <strong>${teamName}</strong> from entering the tournament.`;

    const htmlContent = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <style>
        body { margin: 0; padding: 0; background-color: #0F172A; font-family: 'Inter', sans-serif; color: #f1f5f9; }
        .container { max-width: 600px; margin: 40px auto; background-color: #1E293B; border-radius: 12px; overflow: hidden; border: 1px solid #334155; }
        .header { background: ${color}; padding: 30px; text-align: center; }
        .header h1 { margin: 0; color: #fff; font-size: 24px; font-weight: 800; text-transform: uppercase; letter-spacing: 1px; }
        .content { padding: 40px 30px; text-align: center; }
        .message { font-size: 16px; line-height: 1.6; color: #94a3b8; margin-bottom: 20px; }
        .box { background-color: #0F172A; border: 1px dashed ${color}; border-radius: 8px; padding: 20px; margin-bottom: 30px; }
        .t-name { font-size: 20px; font-weight: 800; color: ${color}; margin: 0; }
        .footer { padding: 20px; text-align: center; font-size: 12px; color: #64748b; border-top: 1px solid #334155; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header"><h1>${title}</h1></div>
        <div class="content">
          <div class="message">${msg}</div>
          <div class="box">
            <h2 class="t-name">${tournamentName}</h2>
          </div>
        </div>
        <div class="footer">&copy; ${new Date().getFullYear()} ArenaPulse Esports.</div>
      </div>
    </body>
    </html>
    `;

    const mailOptions = {
      from: `"ArenaPulse" <${process.env.EMAIL_USER}>`,
      to: userEmails.join(','),
      subject: `Tournament ${title}: ${teamName}`,
      html: htmlContent,
    };

    await transporter.sendMail(mailOptions);
    return true;
  } catch (error) {
    console.error('[Email Service] Error sending status email:', error);
    return false;
  }
};

export const sendPlayerDeclinedEmail = async (captainEmail, captainName, playerName, teamName, tournamentName) => {
  try {
    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) return false;

    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || 'smtp.gmail.com',
      port: process.env.SMTP_PORT || 587,
      secure: process.env.SMTP_SECURE === 'true',
      auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS },
    });

    const htmlContent = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <style>
        body { margin: 0; padding: 0; background-color: #0F172A; font-family: 'Inter', sans-serif; color: #f1f5f9; }
        .container { max-width: 600px; margin: 40px auto; background-color: #1E293B; border-radius: 12px; overflow: hidden; border: 1px solid #334155; }
        .header { background: #ef4444; padding: 30px; text-align: center; }
        .header h1 { margin: 0; color: #fff; font-size: 24px; font-weight: 800; text-transform: uppercase; }
        .content { padding: 40px 30px; text-align: center; }
        .message { font-size: 16px; line-height: 1.6; color: #94a3b8; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header"><h1>Enrollment Aborted</h1></div>
        <div class="content">
          <div class="message">
            Hello Captain <strong>${captainName}</strong>,<br><br>
            <strong>${playerName}</strong> has marked themselves as unavailable for <strong>${tournamentName}</strong>.<br><br>
            As a result, your team's enrollment request has been completely aborted. You must replace the player or choose a different tournament.
          </div>
        </div>
      </div>
    </body>
    </html>
    `;

    const mailOptions = {
      from: `"ArenaPulse" <${process.env.EMAIL_USER}>`,
      to: captainEmail,
      subject: `Enrollment Aborted: Player Unavailable`,
      html: htmlContent,
    };

    await transporter.sendMail(mailOptions);
    return true;
  } catch (error) {
    console.error('[Email Service] Error sending declined email:', error);
    return false;
  }
};

export const sendTeamCompleteEmail = async (captainEmail, captainName, teamName) => {
  try {
    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) return false;

    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || 'smtp.gmail.com',
      port: process.env.SMTP_PORT || 587,
      secure: process.env.SMTP_SECURE === 'true',
      auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS },
    });

    const loginUrl = process.env.CLIENT_URL ? `${process.env.CLIENT_URL}/tournaments` : 'https://arena-pulse-pi.vercel.app/tournaments';

    const htmlContent = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <style>
        body { margin: 0; padding: 0; background-color: #0F172A; font-family: 'Inter', sans-serif; color: #f1f5f9; }
        .container { max-width: 600px; margin: 40px auto; background-color: #1E293B; border-radius: 12px; overflow: hidden; border: 1px solid #334155; }
        .header { background: #10b981; padding: 30px; text-align: center; }
        .header h1 { margin: 0; color: #fff; font-size: 24px; font-weight: 800; text-transform: uppercase; }
        .content { padding: 40px 30px; text-align: center; }
        .message { font-size: 16px; line-height: 1.6; color: #94a3b8; margin-bottom: 20px; }
        .btn { display: inline-block; background-color: #10b981; color: #fff !important; text-decoration: none; font-size: 16px; font-weight: 700; padding: 14px 32px; border-radius: 8px; text-transform: uppercase; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header"><h1>Roster Complete</h1></div>
        <div class="content">
          <div class="message">
            Hello Captain <strong>${captainName}</strong>,<br><br>
            All pending players have accepted your invitations! Your team <strong>${teamName}</strong> roster is now completely filled and ready for action.<br><br>
            You can now enroll your team into tournaments!
          </div>
          <a href="${loginUrl}" class="btn">Find Tournaments</a>
        </div>
      </div>
    </body>
    </html>
    `;

    const mailOptions = {
      from: `"ArenaPulse" <${process.env.EMAIL_USER}>`,
      to: captainEmail,
      subject: `Roster Complete: ${teamName} is ready!`,
      html: htmlContent,
    };

    await transporter.sendMail(mailOptions);
    return true;
  } catch (error) {
    console.error('[Email Service] Error sending team complete email:', error);
    return false;
  }
};

export const sendOrganizerRegistrationRequestEmail = async (organizerEmail, organizerName, teamName, tournamentName) => {
  try {
    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) return false;

    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || 'smtp.gmail.com',
      port: process.env.SMTP_PORT || 587,
      secure: process.env.SMTP_SECURE === 'true',
      auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS },
    });

    const loginUrl = process.env.CLIENT_URL ? `${process.env.CLIENT_URL}/tournaments` : 'https://arena-pulse-pi.vercel.app/tournaments';

    const htmlContent = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <style>
        body { margin: 0; padding: 0; background-color: #0F172A; font-family: 'Inter', sans-serif; color: #f1f5f9; }
        .container { max-width: 600px; margin: 40px auto; background-color: #1E293B; border-radius: 12px; overflow: hidden; border: 1px solid #334155; }
        .header { background: #3b82f6; padding: 30px; text-align: center; }
        .header h1 { margin: 0; color: #fff; font-size: 24px; font-weight: 800; text-transform: uppercase; }
        .content { padding: 40px 30px; text-align: center; }
        .message { font-size: 16px; line-height: 1.6; color: #94a3b8; margin-bottom: 20px; }
        .btn { display: inline-block; background-color: #3b82f6; color: #fff !important; text-decoration: none; font-size: 16px; font-weight: 700; padding: 14px 32px; border-radius: 8px; text-transform: uppercase; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header"><h1>New Team Enrollment</h1></div>
        <div class="content">
          <div class="message">
            Hello <strong>${organizerName}</strong>,<br><br>
            A new team, <strong>${teamName}</strong>, has fully confirmed their roster and requested to enroll in your tournament: <strong>${tournamentName}</strong>.<br><br>
            Please log in to your dashboard to review their registration and approve or reject it.
          </div>
          <a href="${loginUrl}" class="btn">Manage Registrations</a>
        </div>
      </div>
    </body>
    </html>
    `;

    const mailOptions = {
      from: `"ArenaPulse" <${process.env.EMAIL_USER}>`,
      to: organizerEmail,
      subject: `New Team Enrollment: ${teamName} wants to join ${tournamentName}!`,
      html: htmlContent,
    };

    await transporter.sendMail(mailOptions);
    return true;
  } catch (error) {
    console.error('[Email Service] Error sending organizer registration request email:', error);
    return false;
  }
};

export const sendWelcomeEmail = async (email, name) => {
  try {    
    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
      console.warn('[Email Service] Missing EMAIL_USER or EMAIL_PASS in environment variables.');
      return false;
    }

    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || 'smtp.gmail.com',
      port: process.env.SMTP_PORT || 587,
      secure: process.env.SMTP_SECURE === 'true',
      auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS },
    });

    const loginUrl = process.env.CLIENT_URL ? `${process.env.CLIENT_URL}/login` : 'https://arena-pulse-pi.vercel.app/login';

    const htmlContent = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <style>
        body { margin: 0; padding: 0; background-color: #0F172A; font-family: 'Inter', sans-serif; color: #f1f5f9; }
        .container { max-width: 600px; margin: 40px auto; background-color: #1E293B; border-radius: 12px; overflow: hidden; border: 1px solid #334155; }
        .header { background: #3b82f6; padding: 30px; text-align: center; }
        .header h1 { margin: 0; color: #fff; font-size: 24px; font-weight: 800; text-transform: uppercase; }
        .content { padding: 40px 30px; text-align: center; }
        .message { font-size: 16px; line-height: 1.6; color: #94a3b8; margin-bottom: 20px; }
        .btn { display: inline-block; background-color: #3b82f6; color: #fff !important; text-decoration: none; font-size: 16px; font-weight: 700; padding: 14px 32px; border-radius: 8px; text-transform: uppercase; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header"><h1>Welcome to ArenaPulse!</h1></div>
        <div class="content">
          <div class="message">
            Welcome to the arena, <strong>${name}</strong>!<br><br>
            We are thrilled to have you join ArenaPulse. Whether you're here to dominate the competition, build your dream team, or organize epic tournaments, you are in the right place.<br><br>
            Get started by logging in and exploring the tournament board!
          </div>
          <a href="${loginUrl}" class="btn">Go to Dashboard</a>
        </div>
      </div>
    </body>
    </html>
    `;

    const mailOptions = {
      from: `"ArenaPulse" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: `Welcome to ArenaPulse, ${name}!`,
      html: htmlContent,
    };

    await transporter.sendMail(mailOptions);
    return true;
  } catch (error) {
    console.error('[Email Service] Error sending welcome email:', error);
    return false;
  }
};

export const sendNewTournamentEmail = async (playerEmails, tournamentName, game, prizePool, organizerName) => {
  try {
    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) return false;

    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || 'smtp.gmail.com',
      port: process.env.SMTP_PORT || 587,
      secure: process.env.SMTP_SECURE === 'true',
      auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS },
    });

    const loginUrl = process.env.CLIENT_URL ? `${process.env.CLIENT_URL}/tournaments` : 'https://arena-pulse-pi.vercel.app/tournaments';

    const htmlContent = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <style>
        body { margin: 0; padding: 0; background-color: #0F172A; font-family: 'Inter', sans-serif; color: #f1f5f9; }
        .container { max-width: 600px; margin: 40px auto; background-color: #1E293B; border-radius: 12px; overflow: hidden; border: 1px solid #334155; }
        .header { background: #8b5cf6; padding: 30px; text-align: center; }
        .header h1 { margin: 0; color: #fff; font-size: 24px; font-weight: 800; text-transform: uppercase; }
        .content { padding: 40px 30px; text-align: center; }
        .message { font-size: 16px; line-height: 1.6; color: #94a3b8; margin-bottom: 20px; }
        .highlight { color: #8b5cf6; font-weight: bold; }
        .btn { display: inline-block; background-color: #8b5cf6; color: #fff !important; text-decoration: none; font-size: 16px; font-weight: 700; padding: 14px 32px; border-radius: 8px; text-transform: uppercase; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header"><h1>New Tournament Announced!</h1></div>
        <div class="content">
          <div class="message">
            A new tournament has just been created by <strong class="highlight">${organizerName}</strong>!
            <br><br>
            <strong>Tournament:</strong> ${tournamentName}<br>
            <strong>Game:</strong> ${game}<br>
            <strong>Prize Pool:</strong> ${prizePool}<br>
            <br>
            Gather your team and register before all the slots are filled!
          </div>
          <a href="${loginUrl}" class="btn">View Tournaments</a>
        </div>
      </div>
    </body>
    </html>
    `;

    const mailOptions = {
      from: `"ArenaPulse" <${process.env.EMAIL_USER}>`,
      bcc: playerEmails,
      subject: `New Tournament Announced: ${tournamentName}!`,
      html: htmlContent,
    };

    await transporter.sendMail(mailOptions);
    return true;
  } catch (error) {
    console.error('[Email Service] Error sending new tournament email:', error);
    return false;
  }
};

export const sendTournamentUpdateEmail = async (playerEmails, tournamentName, actionType, organizerName) => {
  try {
    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) return false;

    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || 'smtp.gmail.com',
      port: process.env.SMTP_PORT || 587,
      secure: process.env.SMTP_SECURE === 'true',
      auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS },
    });

    const isUpdate = actionType === 'updated';
    const loginUrl = process.env.CLIENT_URL ? `${process.env.CLIENT_URL}/tournaments` : 'https://arena-pulse-pi.vercel.app/tournaments';
    const actionColor = isUpdate ? '#3b82f6' : '#ef4444'; // blue for update, red for cancel
    const headerTitle = isUpdate ? 'Tournament Updated' : 'Tournament Canceled';
    const actionVerb = isUpdate ? 'updated the details for' : 'canceled';

    const htmlContent = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <style>
        body { margin: 0; padding: 0; background-color: #0F172A; font-family: 'Inter', sans-serif; color: #f1f5f9; }
        .container { max-width: 600px; margin: 40px auto; background-color: #1E293B; border-radius: 12px; overflow: hidden; border: 1px solid #334155; }
        .header { background: ${actionColor}; padding: 30px; text-align: center; }
        .header h1 { margin: 0; color: #fff; font-size: 24px; font-weight: 800; text-transform: uppercase; }
        .content { padding: 40px 30px; text-align: center; }
        .message { font-size: 16px; line-height: 1.6; color: #94a3b8; margin-bottom: 20px; }
        .highlight { color: ${actionColor}; font-weight: bold; }
        .btn { display: inline-block; background-color: ${actionColor}; color: #fff !important; text-decoration: none; font-size: 16px; font-weight: 700; padding: 14px 32px; border-radius: 8px; text-transform: uppercase; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header"><h1>${headerTitle}</h1></div>
        <div class="content">
          <div class="message">
            Organizer <strong class="highlight">${organizerName}</strong> has ${actionVerb} the tournament:<br><br>
            <strong style="font-size: 20px; color: #fff;">${tournamentName}</strong><br><br>
            ${isUpdate ? 'Please check the tournament page for the latest updates on rules, schedule, or prize pool.' : 'This tournament has been permanently deleted and all registrations are voided. We apologize for the inconvenience.'}
          </div>
          ${isUpdate ? `<a href="${loginUrl}" class="btn">View Updates</a>` : ''}
        </div>
      </div>
    </body>
    </html>
    `;

    const mailOptions = {
      from: `"ArenaPulse" <${process.env.EMAIL_USER}>`,
      bcc: playerEmails,
      subject: `Tournament ${isUpdate ? 'Updated' : 'Canceled'}: ${tournamentName}`,
      html: htmlContent,
    };

    await transporter.sendMail(mailOptions);
    return true;
  } catch (error) {
    console.error('[Email Service] Error sending tournament update email:', error);
    return false;
  }
};

export const sendTeamRemovalEmail = async (userEmail, userName, teamName) => {
  try {
    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) return false;

    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || 'smtp.gmail.com',
      port: process.env.SMTP_PORT || 587,
      secure: process.env.SMTP_SECURE === 'true',
      auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS },
    });

    const htmlContent = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <style>
        body { margin: 0; padding: 0; background-color: #0F172A; font-family: 'Inter', sans-serif; color: #f1f5f9; }
        .container { max-width: 600px; margin: 40px auto; background-color: #1E293B; border-radius: 12px; overflow: hidden; border: 1px solid #334155; }
        .header { background: #ef4444; padding: 30px; text-align: center; }
        .header h1 { margin: 0; color: #fff; font-size: 24px; font-weight: 800; text-transform: uppercase; }
        .content { padding: 40px 30px; text-align: center; }
        .message { font-size: 16px; line-height: 1.6; color: #94a3b8; margin-bottom: 20px; }
        .highlight { color: #ef4444; font-weight: bold; }
        .box { background-color: #0F172A; border: 1px dashed #ef4444; border-radius: 8px; padding: 20px; margin-bottom: 30px; margin-top: 20px; }
        .footer { padding: 20px; text-align: center; font-size: 12px; color: #64748b; border-top: 1px solid #334155; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header"><h1>Roster Update</h1></div>
        <div class="content">
          <div class="message">
            Hello <strong>${userName}</strong>,<br><br>
            This is an automated notification to inform you that you have been removed from the active roster of team <strong class="highlight">${teamName}</strong>.
          </div>
          <div class="box">
            Your historical stats with this team have been preserved on your profile. You are now free to join or create a new team to continue competing in the arena.
          </div>
        </div>
        <div class="footer">&copy; ${new Date().getFullYear()} ArenaPulse Esports.</div>
      </div>
    </body>
    </html>
    `;

    const mailOptions = {
      from: `"ArenaPulse" <${process.env.EMAIL_USER}>`,
      to: userEmail,
      subject: `Roster Update: Removed from ${teamName}`,
      html: htmlContent,
    };

    await transporter.sendMail(mailOptions);
    console.log(`[Email Service] Team removal email sent to ${userEmail}`);
    return true;
  } catch (error) {
    console.error('[Email Service] Error sending team removal email:', error);
    return false;
  }
};

export const sendRatingRequestEmail = async (userEmail, userName, tournamentTitle, organizerName) => {
  try {
    const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f1f5f9; margin: 0; padding: 0; color: #1e293b; }
        .container { max-width: 600px; margin: 40px auto; background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1); }
        .header { background-color: #2563eb; padding: 30px 20px; text-align: center; }
        .header h1 { color: #ffffff; margin: 0; font-size: 24px; font-weight: 700; letter-spacing: 1px; text-transform: uppercase; }
        .content { padding: 40px 30px; }
        .message { font-size: 16px; line-height: 1.6; margin-bottom: 25px; }
        .highlight { color: #2563eb; font-weight: 600; }
        .box { background-color: #f8fafc; border-left: 4px solid #ea580c; padding: 15px 20px; margin-bottom: 30px; font-size: 15px; color: #475569; }
        .footer { background-color: #f8fafc; padding: 20px; text-align: center; font-size: 13px; color: #94a3b8; border-top: 1px solid #e2e8f0; }
        .btn { display: inline-block; background-color: #2563eb; color: #ffffff; text-decoration: none; padding: 12px 24px; border-radius: 4px; font-weight: bold; font-size: 14px; text-transform: uppercase; letter-spacing: 1px; margin-top: 10px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>Tournament Completed</h1>
        </div>
        <div class="content">
          <div class="message">
            Hello <strong>${userName}</strong>,<br><br>
            The tournament <strong class="highlight">${tournamentTitle}</strong> has officially concluded!
          </div>
          <div class="box">
            Please log into ArenaPulse to leave a rating out of 5 stars for the organizer, <strong>${organizerName}</strong>. Your feedback helps build a better community for everyone.
          </div>
          <div style="text-align: center;">
             <a href="${process.env.CLIENT_URL || 'http://localhost:5173'}/dashboard" class="btn">Rate Organizer Now</a>
          </div>
        </div>
        <div class="footer">&copy; ${new Date().getFullYear()} ArenaPulse Esports.</div>
      </div>
    </body>
    </html>
    `;

    const mailOptions = {
      from: `"ArenaPulse" <${process.env.EMAIL_USER}>`,
      to: userEmail,
      subject: `Rate the Organizer: ${tournamentTitle}`,
      html: htmlContent,
    };

    await transporter.sendMail(mailOptions);
    console.log(`[Email Service] Rating request email sent to ${userEmail}`);
    return true;
  } catch (error) {
    console.error('[Email Service] Error sending rating request email:', error);
    return false;
  }
};
