#
# Copyright (c) 2013-2014, Prometheus Research, LLC
#


from rex.core import Setting, MaybeVal, StrVal, cached, get_settings
import os
import hashlib
import hmac
import base64
import binascii
import cryptography.exceptions as crypto_exceptions
import cryptography.hazmat.backends as crypto_backends
import cryptography.hazmat.primitives as crypto
import cryptography.hazmat.primitives.ciphers
import cryptography.hazmat.primitives.ciphers.algorithms
import cryptography.hazmat.primitives.ciphers.modes
import cryptography.hazmat.primitives.hashes
import cryptography.hazmat.primitives.hmac
import cryptography.hazmat.primitives.kdf.pbkdf2


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
def get_combined_key(salt):
    # Generates a pair of encryption and validation keys.
    if isinstance(salt, str):
        salt = salt.encode('utf-8')
    settings = get_settings()
    if settings.secret:
        secret = settings.secret.encode('utf-8')
        kdf = crypto.kdf.pbkdf2.PBKDF2HMAC(
                algorithm=crypto.hashes.SHA256(),
                length=(CKEY_SIZE + VKEY_SIZE),
                salt=salt,
                iterations=100000,
                backend=crypto_backends.default_backend())
        key = kdf.derive(secret)
    else:
        key = os.urandom(CKEY_SIZE + VKEY_SIZE)
    return (key[:CKEY_SIZE], key[CKEY_SIZE:])


@cached
def get_encryption_key(salt):
    # Generates a key for AES128.
    return get_combined_key(salt)[0]


@cached
def get_validation_key(salt):
    # Generates a key for HMAC-SHA256.
    return get_combined_key(salt)[1]


def encrypt(plaintext, salt):
    # Encrypts plaintext using AES128.
    if isinstance(plaintext, str):
        plaintext = plaintext.encode('utf-8')
    pad = CBLOCK_SIZE - len(plaintext) % CBLOCK_SIZE
    plaintext += bytes((pad,) * pad)
    key = get_encryption_key(salt)
    iv = os.urandom(CBLOCK_SIZE)
    cipher = crypto.ciphers.Cipher(
            crypto.ciphers.algorithms.AES(key),
            crypto.ciphers.modes.CBC(iv),
            backend=crypto_backends.default_backend())
    encryptor = cipher.encryptor()
    ciphertext = iv + encryptor.update(plaintext) + encryptor.finalize()
    return ciphertext


def decrypt(ciphertext, salt):
    # Decrypts ciphertext.
    if ciphertext is None:
        return
    if not (len(ciphertext) > CBLOCK_SIZE and
            len(ciphertext) % CBLOCK_SIZE == 0):
        return
    iv = ciphertext[:CBLOCK_SIZE]
    ciphertext = ciphertext[CBLOCK_SIZE:]
    key = get_encryption_key(salt)
    cipher = crypto.ciphers.Cipher(
            crypto.ciphers.algorithms.AES(key),
            crypto.ciphers.modes.CBC(iv),
            backend=crypto_backends.default_backend())
    decryptor = cipher.decryptor()
    plaintext = decryptor.update(ciphertext) + decryptor.finalize()
    plaintext = plaintext[:-plaintext[-1]]
    plaintext = plaintext.decode('utf-8')
    return plaintext


def sign(message, salt):
    # Signs message using HMAC-SHA256.
    key = get_validation_key(salt)
    hmac = crypto.hmac.HMAC(
            key,
            crypto.hashes.SHA256(),
            backend=crypto_backends.default_backend())
    hmac.update(message)
    tag = hmac.finalize()
    return tag + message


def validate(tagged, salt):
    # Validates and detags a signed message.
    if tagged is None:
        return None
    if len(tagged) < VDIGEST_SIZE:
        return None
    tag = tagged[:VDIGEST_SIZE]
    message = tagged[VDIGEST_SIZE:]
    key = get_validation_key(salt)
    hmac = crypto.hmac.HMAC(
            key,
            crypto.hashes.SHA256(),
            backend=crypto_backends.default_backend())
    hmac.update(message)
    try:
        hmac.verify(tag)
    except crypto_exceptions.InvalidSignature:
        return None
    return message


def b2a(binary):
    # Converts binary string to a cookie-safe value (uses modified Base64).
    return base64.urlsafe_b64encode(binary).rstrip(b'=').decode('latin1')


def a2b(text):
    # Reverses `b2a()`.
    if text is None:
        return None
    if isinstance(text, str):
        text = text.encode('utf-8')
    try:
        return base64.urlsafe_b64decode(text + b'=' * (-len(text) % 4))
    except binascii.Error:
        return None


def encrypt_and_sign(text, salt):
    """
    Encrypts and signs a message and converts it to a cookie-safe value.
    """
    return b2a(sign(encrypt(text, salt), salt))


def validate_and_decrypt(text, salt):
    """
    Validates and decrypt a signed and encrypted message.
    """
    return decrypt(validate(a2b(text), salt), salt)


