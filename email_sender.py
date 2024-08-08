import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart

def send_email(email, password, recipient, subject, content, cc_recipients=None, bcc_recipients=None):
    server = smtplib.SMTP_SSL('smtp.gmail.com', 465)
    server.ehlo()
    server.login(email, password)

    msg = MIMEMultipart()
    msg['From'] = email
    msg['To'] = recipient
    msg['Subject'] = subject

    msg.attach(MIMEText(content, 'html'))

    if cc_recipients:
        msg['Cc'] = ', '.join(cc_recipients)

    if bcc_recipients:
        msg['Bcc'] = ', '.join(bcc_recipients)

    try:
        server.sendmail(email, [recipient] + (cc_recipients or []) + (bcc_recipients or []), msg.as_string())
        print("Email sent successfully!")
    except Exception as e:
        print(f"Error sending email: {e}")
    finally:
        server.quit()
send_email(
    email='ngocvipns5@gmail.com',
    password='qqds epzx bemm bdqr',
    recipient='thoikhoabieua2@gmail.com',
    subject='Tiêu đề của email',
    content='Đây là nội dung của email.'
)