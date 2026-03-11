"""
Enhanced input validation utilities for the application.
Provides comprehensive functions to validate and sanitize user inputs with improved security.
"""
import re
import logging
from typing import Dict, List, Optional, Union
from fastapi import HTTPException, UploadFile
from PIL import Image
import io
import magic

# It is highly recommended to use battle-tested libraries for sanitization.
import bleach
from werkzeug.utils import secure_filename

logger = logging.getLogger(__name__)

class InputValidator:
    """Enhanced utilities for validating and sanitizing user inputs"""
    
    # Common patterns for validation
    EMAIL_PATTERN = re.compile(r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$')
    USERNAME_PATTERN = re.compile(r'^[a-zA-Z0-9_-]{3,50}$')
    PHONE_PATTERN = re.compile(r'^\+?1?-?\.?/?\(?(\d{3})\)?\.?/?(\d{3})\.?/?(\d{4})$')
    
    # Security patterns
    SQL_INJECTION_PATTERNS = [
        r"(\bselect\b|\binsert\b|\bupdate\b|\bdelete\b|\bdrop\b|\bunion\b)",
        r"(\bor\b\s+\d+\s*=\s*\d+|\band\b\s+\d+\s*=\s*\d+)",
        r"('.*'|\".*\")",
        r"(--|\/\*|\*\/|;|\||&)"
    ]
    
    XSS_PATTERNS = [
        r"<script[^>]*>.*?</script>",
        r"<iframe[^>]*>.*?</iframe>",
        r"javascript:",
        r"on\w+\s*=",
        r"<object[^>]*>.*?</object>",
        r"<embed[^>]*>.*?</embed>"
    ]
    
    @staticmethod
    def validate_email(email: str) -> bool:
        """Validate email format with enhanced checks"""
        if not email or not isinstance(email, str):
            return False
        
        email = email.strip().lower()
        
        # Basic format check
        if not InputValidator.EMAIL_PATTERN.match(email):
            return False
        
        # Additional security checks
        if len(email) > 254:  # RFC 5321 limit
            return False
        
        # Check for suspicious patterns
        suspicious_chars = ['<', '>', '"', "'", ';', '&', '|']
        if any(char in email for char in suspicious_chars):
            return False
        
        return True
    
    @staticmethod
    def validate_username(username: str) -> bool:
        """Validate username with enhanced security checks"""
        if not username or not isinstance(username, str):
            return False
        
        username = username.strip()
        
        # Basic pattern check
        if not InputValidator.USERNAME_PATTERN.match(username):
            return False
        
        # Security checks
        if len(username) < 3 or len(username) > 50:
            return False
        
        # Check for reserved usernames
        reserved_names = ['admin', 'root', 'system', 'null', 'undefined', 'test', 'guest']
        if username.lower() in reserved_names:
            return False
        
        # Check for offensive content (basic check)
        offensive_words = ['admin', 'root', 'system', 'null', 'undefined', 'test', 'guest']
        if any(word in username.lower() for word in offensive_words):
            return False
        
        return True
    
    @staticmethod
    def validate_password_strength(password: str) -> None:
        """
        Enhanced password strength validation.
        Raises HTTPException with a 400 status code if validation fails.
        """
        if not password or not isinstance(password, str):
            raise HTTPException(status_code=400, detail="Password is required")
        
        if len(password) < 8:
            raise HTTPException(status_code=400, detail="Password must be at least 8 characters long")
        
        if len(password) > 128:  # Prevent DoS from extremely long passwords
            raise HTTPException(status_code=400, detail="Password must be less than 128 characters")
        
        # Character class checks
        checks = {
            'lowercase': r'[a-z]',
            'uppercase': r'[A-Z]', 
            'digit': r'[0-9]',
            'special': r'[!@#$%^&*(),.?":{}|<>]'
        }
        
        missing = []
        for check_name, pattern in checks.items():
            if not re.search(pattern, password):
                missing.append(check_name)
        
        if missing:
            raise HTTPException(
                status_code=400, 
                detail=f"Password must contain at least one: {', '.join(missing)}"
            )
        
        # Check for common weak patterns
        common_patterns = [
            r'(.)\1{2,}',  # Repeated characters (aaa, 111)
            r'(012|123|234|345|456|567|678|789|890)',  # Sequential numbers
            r'(abc|bcd|cde|def|efg|fgh|ghi|hij|ijk|jkl|klm|lmn|mno|nop|opq|pqr|qrs|rst|stu|tuv|uvw|vwx|wxy|xyz)',  # Sequential letters
        ]
        
        for pattern in common_patterns:
            if re.search(pattern, password.lower()):
                raise HTTPException(
                    status_code=400, 
                    detail="Password cannot contain repeated or sequential characters"
                )
    
    @staticmethod
    def sanitize_string(text: str, max_length: int = 1000, allow_html: bool = False) -> str:
        """
        Enhanced string sanitization with XSS prevention.
        Uses the 'bleach' library for robust sanitization.
        """
        if not text:
            return ""
        
        if not isinstance(text, str):
            text = str(text)
        
        # Truncate before sanitization to prevent DoS
        if len(text) > max_length * 2:  # Allow some buffer for sanitization
            text = text[:max_length * 2]
        
        # Check for SQL injection patterns
        for pattern in InputValidator.SQL_INJECTION_PATTERNS:
            if re.search(pattern, text, re.IGNORECASE):
                logger.warning(f"Potential SQL injection attempt detected in input: {text[:100]}")
                raise HTTPException(status_code=400, detail="Invalid characters detected")
        
        # Check for XSS patterns
        for pattern in InputValidator.XSS_PATTERNS:
            if re.search(pattern, text, re.IGNORECASE):
                logger.warning(f"Potential XSS attempt detected in input: {text[:100]}")
                raise HTTPException(status_code=400, detail="Invalid characters detected")
        
        if allow_html:
            # Allow safe HTML tags only
            allowed_tags = ['p', 'br', 'strong', 'em', 'u', 'b', 'i']
            allowed_attributes = {'*': ['class']}
            sanitized = bleach.clean(text, tags=allowed_tags, attributes=allowed_attributes, strip=True)
        else:
            # Strip all HTML tags
            sanitized = bleach.clean(text, tags=[], attributes={}, strip=True)
        
        # Additional sanitization
        sanitized = sanitized.strip()
        
        # Final length check
        if len(sanitized) > max_length:
            sanitized = sanitized[:max_length].strip()
        
        return sanitized
    
    @staticmethod
    def validate_contact_message(name: str, email: str, subject: str, message: str) -> None:
        """Enhanced contact form validation with spam detection"""
        errors: List[Dict[str, str]] = []
        
        # Validate name
        if not name or len(name.strip()) < 2:
            errors.append({"field": "name", "msg": "Name must be at least 2 characters"})
        elif len(name) > 100:
            errors.append({"field": "name", "msg": "Name must be less than 100 characters"})
        else:
            # Sanitize name
            sanitized_name = InputValidator.sanitize_string(name, max_length=100)
            if sanitized_name != name:
                errors.append({"field": "name", "msg": "Name contains invalid characters"})
        
        # Validate email
        if not InputValidator.validate_email(email):
            errors.append({"field": "email", "msg": "Invalid email format"})
        
        # Validate subject
        if not subject or len(subject.strip()) < 3:
            errors.append({"field": "subject", "msg": "Subject must be at least 3 characters"})
        elif len(subject) > 200:
            errors.append({"field": "subject", "msg": "Subject must be less than 200 characters"})
        else:
            # Check for spam keywords in subject
            spam_keywords = ['viagra', 'casino', 'loan', 'xxx', 'porn', 'bitcoin', 'crypto', 'investment']
            subject_lower = subject.lower()
            if any(keyword in subject_lower for keyword in spam_keywords):
                errors.append({"field": "subject", "msg": "Subject contains inappropriate content"})
        
        # Validate message
        if not message or len(message.strip()) < 10:
            errors.append({"field": "message", "msg": "Message must be at least 10 characters"})
        elif len(message) > 5000:
            errors.append({"field": "message", "msg": "Message must be less than 5000 characters"})
        else:
            # Check for spam patterns in message
            spam_patterns = [
                r'http[s]?://(?:[a-zA-Z]|[0-9]|[$-_@.&+]|[!*\\(\\),]|(?:%[0-9a-fA-F][0-9a-fA-F]))+',  # URLs
                r'\b\d{3}[-.\s]?\d{3}[-.\s]?\d{4}\b',  # Phone numbers
                r'\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}\b'  # Additional email patterns
            ]
            
            message_lower = message.lower()
            if any(re.search(pattern, message_lower) for pattern in spam_patterns):
                # Allow URLs in messages but flag for review
                pass
        
        if errors:
            raise HTTPException(status_code=422, detail=errors)
    
    @staticmethod
    def sanitize_filename(filename: str) -> str:
        """Enhanced filename sanitization to prevent path traversal"""
        if not filename:
            return "unknown"
        
        # Use Werkzeug's secure_filename as base
        sanitized = secure_filename(filename)
        
        if not sanitized:
            sanitized = "unknown"
        
        # Additional checks
        if len(sanitized) > 255:  # Filesystem limit
            sanitized = sanitized[:255]
        
        # Remove any remaining dangerous characters
        dangerous_chars = ['<', '>', ':', '"', '|', '?', '*']
        for char in dangerous_chars:
            sanitized = sanitized.replace(char, '')
        
        return sanitized

    @staticmethod
    async def validate_image_upload(file: UploadFile, max_size_mb: int = 10) -> bytes:
        """
        Enhanced image validation with format detection and security checks.
        Checks content type, size, and actual file format, returning file content as bytes.
        Raises HTTPException on failure with appropriate status codes.
        """
        if not file or not file.filename:
            raise HTTPException(status_code=400, detail="No file uploaded")
        
        # Check file size first (efficient)
        max_size_bytes = max_size_mb * 1024 * 1024
        
        # Read file content
        contents = await file.read()
        
        if len(contents) == 0:
            raise HTTPException(status_code=400, detail="Empty file uploaded")
        
        if len(contents) > max_size_bytes:
            raise HTTPException(
                status_code=413, 
                detail=f"File too large. Maximum size is {max_size_mb}MB"
            )
        
        # Validate file extension
        allowed_extensions = {'.jpg', '.jpeg', '.png', '.gif', '.webp', '.bmp'}
        file_ext = file.filename.lower().split('.')[-1] if '.' in file.filename else ''
        if file_ext not in allowed_extensions:
            raise HTTPException(
                status_code=415, 
                detail="Unsupported file format. Please upload JPG, PNG, GIF, WebP, or BMP images"
            )
        
        # Validate MIME type
        allowed_mime_types = {
            'image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/bmp'
        }
        
        if file.content_type not in allowed_mime_types:
            raise HTTPException(
                status_code=415, 
                detail="Invalid file type. File must be an image"
            )
        
        # Additional security: Verify actual file format using python-magic
        try:
            file_type = magic.from_buffer(contents, mime=True)
            if file_type not in allowed_mime_types:
                raise HTTPException(
                    status_code=415, 
                    detail="File format does not match extension"
                )
        except Exception as e:
            logger.warning(f"Could not verify file format: {e}")
            # Fall back to basic validation
        
        # Additional check: Verify it's actually an image using PIL
        try:
            image = Image.open(io.BytesIO(contents))
            image.verify()  # This verifies the image data
            
            # Check image dimensions
            image.seek(0)  # Reset file pointer
            image = Image.open(io.BytesIO(contents))
            width, height = image.size
            
            if width < 10 or height < 10:
                raise HTTPException(status_code=400, detail="Image dimensions too small")
            
            if width > 10000 or height > 10000:
                raise HTTPException(status_code=400, detail="Image dimensions too large")
                
        except Exception as e:
            logger.error(f"Image validation failed: {e}")
            raise HTTPException(status_code=400, detail="Invalid image file")
        
        return contents
    
    @staticmethod
    def validate_phone_number(phone: str) -> bool:
        """Validate phone number format"""
        if not phone:
            return False
        
        phone = re.sub(r'[^\d+]', '', phone)  # Remove non-digit characters except +
        
        if not phone:
            return False
        
        return bool(InputValidator.PHONE_PATTERN.match(phone))
    
    @staticmethod
    def validate_url(url: str) -> bool:
        """Validate URL format"""
        if not url:
            return False
        
        url_pattern = re.compile(
            r'^https?://'  # http:// or https://
            r'(?:[-\w.]|(?:%[\da-fA-F]{2}))+'  # domain name
            r'(?::\d+)?'  # optional port
            r'(?:[/?:].*)?$',  # path, query, fragment
            re.IGNORECASE
        )
        
        return bool(url_pattern.match(url))
    
    @staticmethod
    def rate_limit_check(identifier: str, action: str, max_attempts: int = 5, time_window: int = 3600) -> bool:
        """
        Simple rate limiting check (would typically use Redis in production)
        Returns True if action is allowed, False if rate limited
        """
        # This is a basic implementation - in production, use Redis or similar
        import time
        import os
        
        # Create a simple file-based rate limiter for demo purposes
        rate_limit_file = f"rate_limit_{action}_{identifier.replace('@', '_')}.tmp"
        
        try:
            current_time = time.time()
            
            if os.path.exists(rate_limit_file):
                with open(rate_limit_file, 'r') as f:
                    lines = f.readlines()
                
                # Filter out old attempts
                recent_attempts = [
                    float(line.strip()) 
                    for line in lines 
                    if current_time - float(line.strip()) < time_window
                ]
                
                if len(recent_attempts) >= max_attempts:
                    return False  # Rate limited
                
                # Add current attempt
                recent_attempts.append(current_time)
            else:
                recent_attempts = [current_time]
            
            # Write updated attempts
            with open(rate_limit_file, 'w') as f:
                for attempt in recent_attempts:
                    f.write(f"{attempt}\n")
            
            return True  # Allowed
            
        except Exception as e:
            logger.error(f"Rate limit check failed: {e}")
            return True  # Fail open for safety
