import nodemailer from 'nodemailer';

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

    const loginUrl = process.env.CLIENT_URL ? `${process.env.CLIENT_URL}/login` : 'http://localhost:5173/login';

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

    const info = await transporter.sendMail(mailOptions);
    console.log('Invitation email sent: %s', info.messageId);
    return true;
  } catch (error) {
    console.error('Error sending invitation email:', error);
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

    const loginUrl = process.env.CLIENT_URL ? `${process.env.CLIENT_URL}/dashboard` : 'http://localhost:5173/dashboard';

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

    const info = await transporter.sendMail(mailOptions);
    console.log('Enrollment email sent: %s', info.messageId);
    return true;
  } catch (error) {
    console.error('Error sending enrollment email:', error);
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
    console.error('Error sending status email:', error);
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
    console.error('Error sending declined email:', error);
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

    const loginUrl = process.env.CLIENT_URL ? `${process.env.CLIENT_URL}/tournaments` : 'http://localhost:5173/tournaments';

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
    console.error('Error sending team complete email:', error);
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

    const loginUrl = process.env.CLIENT_URL ? `${process.env.CLIENT_URL}/tournaments` : 'http://localhost:5173/tournaments';

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
      from: `"ArenaPulse HQ" <${process.env.EMAIL_USER}>`,
      to: organizerEmail,
      subject: `New Team Enrollment: ${teamName} wants to join ${tournamentName}!`,
      html: htmlContent,
    };

    await transporter.sendMail(mailOptions);
    return true;
  } catch (error) {
    console.error('Error sending organizer registration request email:', error);
    return false;
  }
};
