#
# Copyright (c) 2013, Prometheus Research, LLC
#


from rex.core import Setting, MaybeVal, StrVal, cached, get_settings
import os
import hashlib
import hmac
import base64
import pbkdf2
import Crypto.Cipher.AES


class SecretSetting(Setting):
    """
    Secret passphrase for generating private keys.

    If not set, a random key is used. Must be set for a multi-process server.
    """

    name = 'secret'
    validate = MaybeVal(StrVal())
    default = None


# AES128
CKEY_SIZE = 16
CBLOCK_SIZE = 16

# SHA256
VKEY_SIZE = 64
VDIGEST_SIZE = 32


@cached
def get_encryption_key():
    # Generates a key for AES128.
    secret = get_settings().secret
    if secret:
        return pbkdf2.PBKDF2(secret, "encryption key").read(CKEY_SIZE)
    else:
        return os.urandom(CKEY_SIZE)


@cached
def get_validation_key():
    # Generates a key for HMAC-SHA256.
    secret = get_settings().secret
    if secret:
        return pbkdf2.PBKDF2(secret, "validation key").read(VKEY_SIZE)
    else:
        return os.urandom(VKEY_SIZE)


def encrypt(plaintext):
    # Encrypts plaintext using AES128.
    ckey = get_encryption_key()
    iv = os.urandom(CBLOCK_SIZE)
    cipher = Crypto.Cipher.AES.new(ckey, Crypto.Cipher.AES.MODE_CBC, iv)
    pad = CBLOCK_SIZE - len(plaintext) % CBLOCK_SIZE
    plaintext += chr(pad)*pad
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
    plaintext = plaintext[:-ord(plaintext[-1])]
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
    return base64.b64encode(binary, '._').replace('=', '-')


def a2b(text):
    # Reverses `b2a()`.
    if text is None:
        return None
    try:
        return base64.b64decode(str(text).replace('-', '='), '._')
    except TypeError, exc:
        return None


