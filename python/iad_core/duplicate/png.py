import struct
from dataclasses import dataclass

from PIL import Image


@dataclass(frozen=True)
class PngMetadata:
    """PNG chunk metadata, including eXIf following IDAT, without decoding pixels."""

    width: int
    height: int
    bit_depth: int
    color_type: int
    animated: bool
    orientation: int

    @classmethod
    def read(cls, payload: bytes) -> 'PngMetadata':
        if len(payload) < 33 or payload[:8] != b'\x89PNG\r\n\x1a\n' or payload[8:16] != b'\x00\x00\x00\rIHDR':
            raise ValueError('Invalid PNG header')
        width, height, depth, color = struct.unpack_from('>IIBB', payload, 16)
        animated, orientation, offset = False, 1, 8
        while offset + 12 <= len(payload):
            size, kind = struct.unpack_from('>I4s', payload, offset)
            end = offset + 12 + size
            if size > 0x7fffffff or end > len(payload):
                raise ValueError('Truncated PNG chunk')
            if kind == b'acTL':
                animated = True
            elif kind == b'eXIf':
                exif = Image.Exif()
                exif.load(payload[offset + 8:end - 4])
                orientation = exif.get(274, 1)
            elif kind == b'IEND':
                if size or not width or not height:
                    raise ValueError('Invalid PNG dimensions or end chunk')
                return cls(width, height, depth, color, animated, orientation)
            offset = end
        raise ValueError('PNG end chunk is missing')
