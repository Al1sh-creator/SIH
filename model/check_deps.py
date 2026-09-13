import struct

def get_dll_imports(file_path):
    with open(file_path, 'rb') as f:
        data = f.read()
    
    # Check MZ header
    if data[:2] != b'MZ':
        return []
    
    # PE header offset
    pe_offset = struct.unpack('<I', data[0x3C:0x40])[0]
    if data[pe_offset:pe_offset+4] != b'PE\x00\x00':
        return []
    
    # Optional header magic (0x10b for 32-bit, 0x20b for 64-bit)
    magic = struct.unpack('<H', data[pe_offset+24:pe_offset+26])[0]
    is_64 = (magic == 0x20b)
    
    # Data directory for imports
    if is_64:
        import_dir_offset = pe_offset + 24 + 112 + 8 # offset to import directory RVA
    else:
        import_dir_offset = pe_offset + 24 + 96 + 8
        
    import_rva, import_size = struct.unpack('<II', data[import_dir_offset:import_dir_offset+8])
    if import_rva == 0:
        return []
        
    # Section headers
    num_sections = struct.unpack('<H', data[pe_offset+6:pe_offset+8])[0]
    opt_header_size = struct.unpack('<H', data[pe_offset+20:pe_offset+22])[0]
    section_offset = pe_offset + 24 + opt_header_size
    
    sections = []
    for i in range(num_sections):
        sec = data[section_offset + i*40 : section_offset + (i+1)*40]
        name = sec[:8].strip(b'\x00').decode('latin1')
        vsize, vrva, rsize, roffset = struct.unpack('<IIII', sec[8:24])
        sections.append((vrva, vsize, roffset, rsize))
        
    def rva_to_offset(rva):
        for vrva, vsize, roffset, rsize in sections:
            if vrva <= rva < vrva + max(vsize, rsize):
                return roffset + (rva - vrva)
        return None

    import_file_offset = rva_to_offset(import_rva)
    if not import_file_offset:
        return []
        
    dlls = []
    curr = import_file_offset
    while True:
        # Import descriptor is 20 bytes
        desc = data[curr:curr+20]
        if desc == b'\x00'*20:
            break
        name_rva = struct.unpack('<I', desc[12:16])[0]
        name_offset = rva_to_offset(name_rva)
        if name_offset:
            end = data.find(b'\x00', name_offset)
            dll_name = data[name_offset:end].decode('latin1')
            dlls.append(dll_name)
        curr += 20
    return dlls

dll_path = r'C:\Users\Public\SIH\ai-engine\venv\Lib\site-packages\torch\lib\torch_python.dll'
imports = get_dll_imports(dll_path)
print("Imported DLLs of torch_python.dll:")
for imp in imports:
    print(" -", imp)
