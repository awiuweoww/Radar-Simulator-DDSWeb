/**
 * GATEWAY IDL Compiler & Builder
 * -----------------------------------------
 * Dirancang untuk mengotomatisasi kompilasi IDL OpenDDS menjadi
 * shared library (.so) yang dapat dimuat oleh Node.js.
 */

const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');

const IDL_DIR = path.resolve(__dirname, '../idl');
const MWC_FILE = 'gateway_idl.mwc';

console.log('-----------------------------------------');
console.log(' [SYSTEM] Gateway IDL Builder ...');
console.log('-----------------------------------------');

try {
    
    if (!process.env.DDS_ROOT || !process.env.ACE_ROOT) {
        throw new Error('DDS_ROOT atau ACE_ROOT tidak ditemukan. Pastikan source setenv.sh sudah dijalankan.');
    }

    process.chdir(IDL_DIR);
    console.log(` [DIR] switched to ${IDL_DIR}`);

    
    console.log(' [MPC] Generating GNUACE Makefiles...');
    execSync('$ACE_ROOT/bin/mwc.pl -type gnuace ' + MWC_FILE, { stdio: 'inherit' });

    
    console.log(' [MAKE] Compiling Shared Libraries...');
    execSync('make', { stdio: 'inherit' });

    console.log('-----------------------------------------');
    console.log(' [SUCCESS] All IDLs compiled successfully.');
    console.log(' Libraries are ready to be loaded by server.js');
    console.log('-----------------------------------------');

} catch (error) {
    console.error(' [ERROR] Compilation failed:');
    console.error(error.message);
    process.exit(1);
}
