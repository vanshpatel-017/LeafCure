# Enhanced Contact endpoint with improved security and error handling
# Insert this after the update_user_profile function and before the ADMIN ENDPOINTS section

@api_router.post("/contact")
async def submit_contact_message(contact_data: ContactMessage):
    """
    Submit a contact form message with enhanced validation and security.
    """
    try:
        # Enhanced input validation
        from app.core.validators import InputValidator
        from firebase_admin import firestore
        import re
        
        # Validate inputs with enhanced checks
        InputValidator.validate_contact_message(
            contact_data.name,
            contact_data.email,
            contact_data.subject,
            contact_data.message
        )
        
        # Additional security checks
        # Check for spam patterns
        spam_keywords = ['viagra', 'casino', 'loan', 'xxx', 'porn', 'bitcoin']
        message_lower = contact_data.message.lower()
        subject_lower = contact_data.subject.lower()
        
        for keyword in spam_keywords:
            if keyword in message_lower or keyword in subject_lower:
                logger.warning(f"Potential spam detected from {contact_data.email}")
                raise HTTPException(status_code=400, detail="Message contains inappropriate content")
        
        # Rate limiting check (prevent spam)
        db = firestore.client()
        recent_messages = list(db.collection('contact_messages')
                              .where('email', '==', contact_data.email)
                              .where('timestamp', '>', firestore.SERVER_TIMESTAMP - 3600)  # Last hour
                              .stream())
        
        if len(recent_messages) >= 5:  # Max 5 messages per hour per email
            logger.warning(f"Rate limit exceeded for {contact_data.email}")
            raise HTTPException(status_code=429, detail="Too many messages. Please wait before sending another.")
        
        # Sanitize inputs
        sanitized_name = InputValidator.sanitize_string(contact_data.name, max_length=100)
        sanitized_email = InputValidator.sanitize_string(contact_data.email, max_length=100)
        sanitized_subject = InputValidator.sanitize_string(contact_data.subject, max_length=200)
        sanitized_message = InputValidator.sanitize_string(contact_data.message, max_length=5000)
        
        # Additional email validation
        email_pattern = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
        if not re.match(email_pattern, sanitized_email):
            raise HTTPException(status_code=400, detail="Invalid email format")
        
        # Prepare message data
        message_data = {
            'name': sanitized_name,
            'email': sanitized_email,
            'subject': sanitized_subject,
            'message': sanitized_message,
            'timestamp': firestore.SERVER_TIMESTAMP,
            'read': False,
            'ip_address': None,  # Could be added if needed
            'user_agent': None,  # Could be added if needed
            'spam_score': 0,     # For future spam detection
            'status': 'pending'  # Message status
        }
        
        # Add to database
        doc_ref = db.collection('contact_messages').add(message_data)
        
        # Log successful submission
        logger.info(f"Contact message submitted successfully from {sanitized_email}")
        
        return {
            "success": True, 
            "message": "Thank you for your message! We'll get back to you soon.",
            "message_id": doc_ref[1].id
        }
        
    except HTTPException:
        # Re-raise HTTP exceptions from validation
        raise
    except Exception as e:
        logger.error(f"Error submitting contact message: {e}", exc_info=True)
        raise HTTPException(
            status_code=500, 
            detail="Unable to process your message at this time. Please try again later."
        )
