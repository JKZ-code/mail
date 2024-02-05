document.addEventListener('DOMContentLoaded', function() {

  // Use buttons to toggle between views
  document.querySelector('#inbox').addEventListener('click', () => load_mailbox('inbox'));
  document.querySelector('#sent').addEventListener('click', () => load_mailbox('sent'));
  document.querySelector('#archived').addEventListener('click', () => load_mailbox('archive'));
  document.querySelector('#compose').addEventListener('click', compose_email);

  // Submit handler
  document.querySelector("#compose-form").addEventListener('submit', send_email);

  // By default, load the inbox
  load_mailbox('inbox');
});

function compose_email() {

  // Show compose view and hide other views
  document.querySelector('#emails-view').style.display = 'none';
  document.querySelector('#compose-view').style.display = 'block';
  document.querySelector('#email-detail-view').style.display = 'none';

  // Clear out composition fields
  document.querySelector('#compose-recipients').value = '';
  document.querySelector('#compose-subject').value = '';
  document.querySelector('#compose-body').value = '';
}


function view_email(id) {
  fetch(`/emails/${id}`)
  .then(response => response.json())
  .then(email => {
      // Print email
      console.log(email);
      document.querySelector('#emails-view').style.display = 'none';
      document.querySelector('#compose-view').style.display = 'none';
      document.querySelector('#email-detail-view').style.display = 'block';

      document.querySelector('#email-detail-view').innerHTML = `
      <ul style="list-style-type: none; margin: 0; padding: 0;">
        <li><strong>From:</strong> ${email.sender}</li>
        <li><strong>To:</strong> ${email.recipients}</li>
        <li><strong>Subject:</strong> ${email.subject}</li>
        <li><strong>Timestamp:</strong> ${email.timestamp}</li>
      </ul>
      <hr>
      `

      //Change to read
      if(!email.read){
        fetch(`/emails/${email.id}`, {
          method: 'PUT',
          body: JSON.stringify({
              read: true
          })
        })
      }

      //Archive function
      const btn_arch = document.createElement('button');
      btn_arch.innerHTML = email.archived ? "Unarchived" : "Archive"
      btn_arch.className = "btn btn-sm btn-outline-primary";
      btn_arch.style.marginRight = "10px";
      btn_arch.addEventListener('click', function() {
        fetch(`/emails/${email.id}`, {
          method: 'PUT',
          body: JSON.stringify({
              archived: !email.archived
          })
        })
        .then (() => {load_mailbox('archive')})
      });
      document.querySelector('#email-detail-view').append(btn_arch);

      //Reply function
      const btn_reply = document.createElement('button');
      btn_reply.innerHTML = "Reply";
      btn_reply.className = "btn btn-sm btn-outline-primary";
      btn_reply.addEventListener('click', function() {
        
          compose_email();
          document.querySelector('#compose-recipients').value = email.sender;
          let subject = email.subject;
          if (subject.split(' ',1)[0] != "Re:") {
            subject = "Re: " + email.subject;
          }
          document.querySelector('#compose-subject').value = subject;
          document.querySelector('#compose-body').value = `On ${email.timestamp} ${email.sender} wrote: ${email.body}\n`;

      });
      document.querySelector('#email-detail-view').append(btn_reply);
      
      //append body
      const body = document.createElement('div');
      body.innerHTML = '<hr>';
      // Split the email body by line breaks and create a text node for each line
      email.body.split('\n').forEach(line => {
          body.appendChild(document.createTextNode(line));
          body.appendChild(document.createElement('br')); 
      });
      document.querySelector('#email-detail-view').appendChild(body);
  });
}

function load_mailbox(mailbox) {
  
  // Show the mailbox and hide other views
  document.querySelector('#emails-view').style.display = 'block';
  document.querySelector('#compose-view').style.display = 'none';
  document.querySelector('#email-detail-view').style.display = 'none';

  // Show the mailbox name
  document.querySelector('#emails-view').innerHTML = `<h3>${mailbox.charAt(0).toUpperCase() + mailbox.slice(1)}</h3>`;

  // Fetch emails for the mailbox and user
  fetch(`/emails/${mailbox}`)
  .then(response => response.json())
  .then(emails => {
      // Print emails
      console.log(emails);
      // Create a div for each emails
      emails.forEach(email => {
        console.log(email);
        const newEmail = document.createElement('div');
        
        newEmail.innerHTML = `
          <h5>Sender: ${email.sender}</h5>
          <h5>Subject: ${email.subject}</h5>
          <p>${email.timestamp}</p>
        `;
        // Change color of read
        newEmail.className = email.read ? 'list-group-item read' : 'list-group-item unread border-style';
        //Add click event to view email
        newEmail.addEventListener('click', function() {
          view_email(email.id);
        });
        document.querySelector('#emails-view').append(newEmail);
      })
  });
}


function send_email(event) {
  event.preventDefault();
  
  // Store fields
  const recipient = document.querySelector('#compose-recipients').value;
  const subject = document.querySelector('#compose-subject').value;
  const body = document.querySelector('#compose-body').value;

  // Send data to backend
  fetch('/emails', {
    method: 'POST',
    body: JSON.stringify({
        recipients: recipient,
        subject: subject,
        body: body
    })
  })
  .then(response => response.json())
  .then(result => {
      // Print result
      console.log(result);
      load_mailbox('sent');
  });

}

