import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { AnalysisAgent } from '../../../src/core/agents/analysis.js';
import fs from 'fs/promises';
import path from 'path';

describe('AnalysisAgent', () => {
  let agent: AnalysisAgent;
  const testDir = '.test-analysis';

  beforeEach(async () => {
    agent = new AnalysisAgent(testDir);

    // Create test directory
    await fs.mkdir(testDir, { recursive: true });
    await fs.mkdir(path.join(testDir, 'src'), { recursive: true });

    // Create test Java file with various complexity scenarios
    await fs.writeFile(
      path.join(testDir, 'src', 'ComplexClass.java'),
      `package com.example;

import java.util.List;
import java.util.ArrayList;
import java.io.IOException;

public class ComplexClass {
    private String name;
    private int count;

    // Simple method - complexity 1
    public String getName() {
        return name;
    }

    // Method with if - complexity 2
    public void setName(String name) {
        if (name != null) {
            this.name = name;
        }
    }

    // Method with multiple branches - complexity 4
    public int processData(int value) {
        if (value < 0) {
            return -1;
        } else if (value == 0) {
            return 0;
        } else {
            return value * 2;
        }
    }

    // Method with loop - complexity 3
    public int sumArray(int[] arr) {
        int sum = 0;
        for (int i = 0; i < arr.length; i++) {
            sum += arr[i];
        }
        return sum;
    }

    // Method with try-catch - complexity 2
    public void riskyOperation() throws IOException {
        try {
            performOperation();
        } catch (IOException e) {
            throw e;
        }
    }

    private void performOperation() throws IOException {
        // Implementation
    }
}`,
      'utf-8'
    );

    // Create simple class for comparison
    await fs.writeFile(
      path.join(testDir, 'src', 'SimpleClass.java'),
      `package com.example;

public class SimpleClass {
    private int value;

    public int getValue() {
        return value;
    }

    public void setValue(int value) {
        this.value = value;
    }
}`,
      'utf-8'
    );
  });

  afterEach(async () => {
    try {
      await fs.rm(testDir, { recursive: true, force: true });
    } catch {}
  });

  it('should calculate cyclomatic complexity for simple method', async () => {
    const result = await agent.analyzeFile('src/ComplexClass.java');

    expect(result).toBeDefined();
    expect(result.methods).toBeDefined();

    const getName = result.methods.find(m => m.name === 'getName');
    expect(getName).toBeDefined();
    expect(getName?.complexity).toBe(1); // No branches
  });

  it('should calculate complexity for method with if statement', async () => {
    const result = await agent.analyzeFile('src/ComplexClass.java');

    const setName = result.methods.find(m => m.name === 'setName');
    expect(setName).toBeDefined();
    expect(setName?.complexity).toBeGreaterThanOrEqual(2); // if adds 1
  });

  it('should calculate complexity for method with multiple branches', async () => {
    const result = await agent.analyzeFile('src/ComplexClass.java');

    const processData = result.methods.find(m => m.name === 'processData');
    expect(processData).toBeDefined();
    expect(processData?.complexity).toBeGreaterThanOrEqual(3); // if + else if + else
  });

  it('should calculate complexity for method with loop', async () => {
    const result = await agent.analyzeFile('src/ComplexClass.java');

    const sumArray = result.methods.find(m => m.name === 'sumArray');
    expect(sumArray).toBeDefined();
    expect(sumArray?.complexity).toBeGreaterThanOrEqual(2); // for loop adds 1
  });

  it('should count lines of code', async () => {
    const result = await agent.analyzeFile('src/ComplexClass.java');

    expect(result.metrics.totalLines).toBeGreaterThan(0);
    expect(result.metrics.codeLines).toBeGreaterThan(0);
    expect(result.metrics.codeLines).toBeLessThan(result.metrics.totalLines);
  });

  it('should extract imports', async () => {
    const result = await agent.analyzeFile('src/ComplexClass.java');

    expect(result.imports).toBeDefined();
    expect(result.imports.length).toBeGreaterThan(0);
    expect(result.imports).toContain('java.util.List');
    expect(result.imports).toContain('java.util.ArrayList');
  });

  it('should calculate class-level complexity', async () => {
    const result = await agent.analyzeFile('src/ComplexClass.java');

    expect(result.classComplexity).toBeGreaterThan(0);
    expect(result.classComplexity).toBeGreaterThanOrEqual(result.methods.length);
  });

  it('should analyze simple class correctly', async () => {
    const result = await agent.analyzeFile('src/SimpleClass.java');

    expect(result.methods.length).toBe(2); // getValue, setValue
    expect(result.classComplexity).toBe(2); // Both methods are simple
  });

  it('should analyze entire project', async () => {
    const results = await agent.analyzeProject();

    expect(results.files.length).toBe(2);
    expect(results.totalComplexity).toBeGreaterThan(0);
    expect(results.averageComplexity).toBeGreaterThan(0);
  });

  it('should return empty result for non-existent file', async () => {
    const result = await agent.analyzeFile('NonExistent.java');

    expect(result.methods).toEqual([]);
    expect(result.imports).toEqual([]);
    expect(result.classComplexity).toBe(0);
  });

  it('should detect method calls', async () => {
    const result = await agent.analyzeFile('src/ComplexClass.java');

    const riskyOp = result.methods.find(m => m.name === 'riskyOperation');
    expect(riskyOp).toBeDefined();
    // Should detect call to performOperation
    expect(riskyOp?.calls).toBeDefined();
  });
});
