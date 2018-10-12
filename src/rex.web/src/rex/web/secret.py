#
# Copyright (c) 2013-2014, Prometheus Research, LLC
#


from rex.core import Setting, MaybeVal, StrVal, cached, get_settings
import os
import hashlib
import hmac
import base64
import binascii
import pbkdf2
import Crypto.Cipher.AES


class SecretSetting(Setting):
    """
    Secret passphrase for generating private keys.

    Example::

        secret: A S3cr3t Passphras3!

    If not set, a random key is used.  This setting must be specified if
    the application is running under a multi-process HTTP server.
    """

    name = 'secret'
    validate = MaybeVal(StrVal())
    default = None


# AES128
CKEY_SIZE = 16
CBLOCK_SIZE = 16
CKEY = os.urandom(CKEY_SIZE)

# SHA256
VKEY_SIZE = 64
VDIGEST_SIZE = 32
VKEY = os.urandom(VKEY_SIZE)


@cached
def get_encryption_key():
    # Generates a key for AES128.
    secret = get_settings().secret
    if secret:
        return pbkdf2.PBKDF2(secret, "encryption key").read(CKEY_SIZE)
    else:
        return CKEY


@cached
def get_validation_key():
    # Generates a key for HMAC-SHA256.
    secret = get_settings().secret
    if secret:
        return pbkdf2.PBKDF2(secret, "validation key").read(VKEY_SIZE)
    else:
        return VKEY


def encrypt(plaintext):
    # Encrypts plaintext using AES128.
    if isinstance(plaintext, str):
        plaintext = plaintext.encode('utf-8')
    ckey = get_encryption_key()
    iv = os.urandom(CBLOCK_SIZE)
    cipher = Crypto.Cipher.AES.new(ckey, Crypto.Cipher.AES.MODE_CBC, iv)
    pad = CBLOCK_SIZE - len(plaintext) % CBLOCK_SIZE
    plaintext += bytes((pad,)*pad)
    ciphertext = iv + cipher.encrypt(plaintext)
    return ciphertext


def decrypt(ciphertext):
    # Decrypts ciphertext.
    if ciphertext is None:
        return
    if not (len(ciphertext) > CBLOCK_SIZE and
            len(ciphertext) % CBLOCK_SIZE == 0):
        return
    ckey = get_encryption_key()
    iv = ciphertext[:CBLOCK_SIZE]
    cipher = Crypto.Cipher.AES.new(ckey, Crypto.Cipher.AES.MODE_CBC, iv)
    plaintext = cipher.decrypt(ciphertext[CBLOCK_SIZE:])
    plaintext = plaintext[:-plaintext[-1]]
    plaintext = plaintext.decode('utf-8')
    return plaintext


def sign(message):
    # Signs message using HMAC-SHA256.
    vkey = get_validation_key()
    tag = hmac.new(vkey, message, hashlib.sha256).digest()
    return tag+message


def validate(tagged):
    # Validates and detags a signed message.
    if tagged is None:
        return None
    if len(tagged) < VDIGEST_SIZE:
        return None
    tag1 = tagged[:VDIGEST_SIZE]
    message = tagged[VDIGEST_SIZE:]
    vkey = get_validation_key()
    tag2 = hmac.new(vkey, message, hashlib.sha256).digest()
    is_equal = True
    for ch1, ch2 in zip(tag1, tag2):
        is_equal &= (ch1 == ch2)
    if not is_equal:
        return None
    return message


def b2a(binary):
    # Converts binary string to a cookie-safe value (uses modified Base64).
    return base64.b64encode(binary, b'._').replace(b'=', b'-').decode('latin1')


def a2b(text):
    # Reverses `b2a()`.
    if text is None:
        return None
    if isinstance(text, str):
        text = text.encode('utf-8')
    try:
        return base64.b64decode(text.replace(b'-', b'='), b'._')
    except binascii.Error:
        return None


def encrypt_and_sign(text):
    """
    Encrypts and signs a message and converts it to a cookie-safe value.
    """
    return b2a(sign(encrypt(text)))


def validate_and_decrypt(text):
    """
    Validates and decrypt a signed and encrypted message.
    """
    return decrypt(validate(a2b(text)))


