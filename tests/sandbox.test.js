/**
 * Sandbox Manager Tests
 */

const assert = require('assert');
const fs = require('fs');
const path = require('path');
const SandboxManager = require('../dist/sandbox/shell');

const TEST_DIR = path.join(__dirname, '.test-sandbox');

function cleanup() {
  if (fs.existsSync(TEST_DIR)) {
    fs.rmSync(TEST_DIR, { recursive: true, force: true });
  }
}

// Mock constitution
const mockConstitution = {
  validateAction: () => ({ allowed: true })
};

describe('SandboxManager', () => {
  let sandbox;

  beforeEach(() => {
    cleanup();
    sandbox = new SandboxManager({
      dataDir: TEST_DIR,
      timeout: 5000,
      constitution: mockConstitution
    });
  });

  afterEach(() => {
    cleanup();
    sandbox.cleanup();
  });

  describe('constructor', () => {
    it('should initialize with correct settings', () => {
      assert.ok(sandbox.dataDir);
      assert.strictEqual(sandbox.timeout, 5000);
      assert.ok(sandbox.allowedCommands.size > 0);
    });

    it('should create data directory', () => {
      assert.ok(fs.existsSync(TEST_DIR));
    });
  });

  describe('execute()', () => {
    it('should execute simple commands', async () => {
      const result = await sandbox.execute('echo "hello"');
      
      assert.strictEqual(result.success, true);
      assert.ok(result.stdout.includes('hello'));
    });

    it('should block dangerous commands', async () => {
      const result = await sandbox.execute('rm -rf /');
      
      assert.strictEqual(result.blocked, true);
      assert.strictEqual(result.success, false);
    });

    it('should handle command timeout', async () => {
      const slowSandbox = new SandboxManager({
        dataDir: TEST_DIR,
        timeout: 100
      });
      
      const result = await slowSandbox.execute('sleep 5');
      
      // Should either timeout or error
      assert.ok(result.success === false || result.error);
    });
  });

  describe('file operations', () => {
    describe('writeFile()', () => {
      it('should write a file', async () => {
        const result = await sandbox.writeFile('test.txt', 'Hello World');
        
        assert.strictEqual(result.success, true);
        assert.ok(result.path);
      });
    });

    describe('readFile()', () => {
      it('should read an existing file', async () => {
        await sandbox.writeFile('test.txt', 'Hello World');
        
        const result = await sandbox.readFile('test.txt');
        
        assert.strictEqual(result.success, true);
        assert.strictEqual(result.content, 'Hello World');
      });

      it('should fail for non-existent file', async () => {
        const result = await sandbox.readFile('nonexistent.txt');
        
        assert.strictEqual(result.success, false);
        assert.ok(result.error);
      });
    });

    describe('deleteFile()', () => {
      it('should delete a file', async () => {
        await sandbox.writeFile('todelete.txt', 'delete me');
        
        const result = await sandbox.deleteFile('todelete.txt');
        
        assert.strictEqual(result.success, true);
      });
    });

    describe('listDir()', () => {
      it('should list directory contents', async () => {
        await sandbox.writeFile('file1.txt', 'content1');
        await sandbox.writeFile('file2.txt', 'content2');
        
        const result = await sandbox.listDir('.');
        
        assert.strictEqual(result.success, true);
        assert.ok(result.entries.length >= 2);
      });
    });

    describe('createDir()', () => {
      it('should create a directory', async () => {
        const result = await sandbox.createDir('newdir/nested');
        
        assert.strictEqual(result.success, true);
      });
    });
  });

  describe('port management', () => {
    describe('exposePort()', () => {
      it('should expose a port', async () => {
        const result = await sandbox.exposePort(34567);
        
        assert.strictEqual(result.success, true);
        assert.ok(result.url);
      });

      it('should not expose same port twice', async () => {
        await sandbox.exposePort(34568);
        
        const result = await sandbox.exposePort(34568);
        
        assert.strictEqual(result.success, false);
        assert.ok(result.error.includes('already'));
      });
    });

    describe('unexposePort()', () => {
      it('should unexpose a port', async () => {
        await sandbox.exposePort(34569);
        
        const result = await sandbox.unexposePort(34569);
        
        assert.strictEqual(result.success, true);
      });
    });

    describe('getExposedPorts()', () => {
      it('should return exposed ports', async () => {
        await sandbox.exposePort(34570);
        
        const ports = sandbox.getExposedPorts();
        
        assert.ok(ports.length > 0);
        assert.ok(ports[0].port);
      });
    });
  });

  describe('process management', () => {
    describe('getActiveProcesses()', () => {
      it('should return active processes', () => {
        const processes = sandbox.getActiveProcesses();
        
        assert.ok(Array.isArray(processes));
      });
    });

    describe('killProcess()', () => {
      it('should fail for non-existent process', async () => {
        const result = await sandbox.killProcess('nonexistent');
        
        assert.strictEqual(result.success, false);
      });
    });
  });

  describe('command validation', () => {
    it('should validate safe commands', () => {
      const result = sandbox._validateCommand('ls -la');
      
      assert.strictEqual(result.allowed, true);
    });

    it('should block dangerous patterns', () => {
      const result = sandbox._validateCommand('rm -rf /');
      
      assert.strictEqual(result.allowed, false);
    });
  });

  describe('getStatus()', () => {
    it('should return sandbox status', () => {
      const status = sandbox.getStatus();
      
      assert.ok(status.dataDir);
      assert.ok(status.exposedPorts);
      assert.ok(status.activeProcesses !== undefined);
    });
  });

  describe('cleanup()', () => {
    it('should cleanup resources', async () => {
      await sandbox.exposePort(34571);
      
      await sandbox.cleanup();
      
      assert.strictEqual(sandbox.exposedPorts.size, 0);
      assert.strictEqual(sandbox.activeProcesses.size, 0);
    });
  });
});
