import {
  FACEBOOK_LINK,
  INSTAGRAM_LINK,
  TWITER_LINK,
} from "../../../../config/config.service.js";

export const verifyEmailTemplate = ({ code, title = "Verify Your Email" }) => {
  return `<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Email Verification</title>

<style>
body{
  margin:0;
  padding:0;
  background-color:#f0f4f5;
  font-family:Arial, Helvetica, sans-serif;
}

.container{
  width:100%;
  max-width:600px;
  margin:auto;
  background:#ffffff;
  border-radius:12px;
  padding:30px;
  text-align:center;
}

.logo{
  width:90px;
  margin-bottom:10px;
}

.title{
  color:#5D2E8C;
  font-size:26px;
  margin:10px 0;
}

.text{
  color:#555;
  font-size:16px;
  margin-bottom:20px;
}

.otp{
  display:inline-block;
  background:#5D2E8C;
  color:#fff;
  font-size:30px;
  font-weight:bold;
  padding:15px 30px;
  border-radius:8px;
  letter-spacing:5px;
}

.footer{
  margin-top:30px;
  font-size:13px;
  color:#999;
}

.social img{
  width:38px;
  margin:5px;
}

/* mobile */
@media only screen and (max-width:600px){

.container{
  padding:20px;
}

.title{
  font-size:22px;
}

.text{
  font-size:14px;
}

.otp{
  font-size:24px;
  padding:12px 20px;
}

.social img{
  width:32px;
}

}
</style>
</head>

<body>

<table width="100%" cellspacing="0" cellpadding="0" border="0">
<tr>
<td>

<div class="container">

<img class="logo" src="https://res.cloudinary.com/dmf7unksl/image/upload/v1774740493/Whisper__app__logo.svg_nr7fds.png"/>

<h2 class="title">${title}</h2>

<p class="text">
Use the verification code below to complete your email verification.
</p>

<div class="otp">${code}</div>

<p class="text" style="margin-top:20px;">
If you didn't request this code, you can safely ignore this email.
</p>

<div style="margin-top:25px;">
<h3 style="color:#333;">Stay in touch</h3>

<div class="social">

<a href="${FACEBOOK_LINK}">
<img src="https://res.cloudinary.com/ddajommsw/image/upload/v1670703402/Group35062_erj5dx.png">
</a>

<a href="${INSTAGRAM_LINK}">
<img src="https://res.cloudinary.com/ddajommsw/image/upload/v1670703402/Group35063_zottpo.png">
</a>

<a href="${TWITER_LINK}">
<img src="https://res.cloudinary.com/ddajommsw/image/upload/v1670703402/Group_35064_i8qtfd.png">
</a>

</div>
</div>

<div class="footer">
© ${new Date().getFullYear()} Whisper. All rights reserved.
</div>

</div>

</td>
</tr>
</table> 

</body>
</html>`;
};
