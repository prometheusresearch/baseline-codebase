#
# Copyright (c) 2013, Prometheus Research, LLC
#


from rex.core import Setting, MaybeVal, StrVal, cached
import os
import hashlib
import hmac
import pbkdf2
import Crypto.Cipher


class SecretSetting(Setting):
    """
    Secret passphrase used for generating private keys.

    If not set, a random key is used. Must be set for a multi-process server.
    """

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
    # Generates a key for SHA256.
    secret = get_settings().secret
    if secret:
        return pbkdf2.PBKDF2(secret, "validation key").read(VKEY_SIZE)
    else:
        return os.urandom(VKEY_SIZE)


def encrypt(plaintext):
    ckey = get_encryption_key()
    iv = os.urandom(CBLOCK_SIZE)
    cipher = Crypto.Cipher.AES.new(ckey, Crypto.Cipher.AES.MODE_CBC, iv)
    pad = CBLOCK_SIZE - len(plaintext) % CBLOCK_SIZE
    plaintext += chr(pad)*pad
    ciphertext = iv + cipher.encrypt(plaintext)
    vkey = get_validation_key()
    signature = hmac.new(vkey, ciphertext, hashlib.sha256).digest()
    return signature+ciphertext


def decrypt(signature_ciphertext):
    signature = signature_ciphertext[:VDIGEST_SIZE]
    ciphertext = signature_ciphertext[VDIGEST_SIZE:]
    if not (len(signature) == VDIGEST_SIZE):
        return
    if not (len(ciphertext) > CBLOCK_SIZE and
            len(ciphertext) % CBLOCK_SIZE == 0):
        return
    vkey = get_validation_key()
    signature2 = hmac.new(vkey, ciphertext, hashlib.sha256).digest()
    is_equal = True
    for ch, ch2 in zip(signature, signature2):
        is_equal = is_equal and (ch == ch2)
    if not is_equal:
        return
    ckey = get_encryption_key()
    iv = ciphertext[:CBLOCK_SIZE]
    cipher = Crypto.Cipher.AES.new(ckey, Crypto.Cipher.AES.MODE_CBC, iv)
    plaintext = cipher.decrypt(ciphertext[CBLOCK_SIZE:])
    plaintext = plaintext[:-ord(plaintext[-1])]
    return plaintext


