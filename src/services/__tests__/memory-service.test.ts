/**
 * Memory Service Tests
 * 
 * Tests for the Memory Service implementation
 */

import { MemoryServiceImpl } from '../memory-service';
import { LLMCallEntry } from '../../models/memory-models';

describe('MemoryService', () => {
  let memoryService: MemoryServiceImpl;

  beforeEach(() => {
    // Create a new instance for each test
    memoryService = new MemoryServiceImpl();
  });

  describe('storeLLMCall', () => {
    it('should not throw when storing a valid entry', async () => {
      const entry: LLMCallEntry = {
        step: 'test_step',
        input: { test: 'input' },
        output: { test: 'output' },
        sessionId: 'test-session-123',
        timestamp: new Date()
      };

      // Should not throw even if Mem0 is not configured
      await expect(memoryService.storeLLMCall(entry)).resolves.not.toThrow();
    });

    it('should not throw when storing an entry with optional fields', async () => {
      const entry: LLMCallEntry = {
        step: 'test_step',
        input: { test: 'input' },
        output: { test: 'output' },
        sessionId: 'test-session-123',
        userId: 'user-456',
        workflowType: 'test_workflow',
        timestamp: new Date(),
        metadata: { extra: 'data' }
      };

      await expect(memoryService.storeLLMCall(entry)).resolves.not.toThrow();
    });

    it('should handle invalid entries gracefully', async () => {
      const invalidEntry = {
        step: '',
        input: {},
        output: {},
        sessionId: '',
        timestamp: new Date()
      } as LLMCallEntry;

      // Should not throw even with invalid entry
      await expect(memoryService.storeLLMCall(invalidEntry)).resolves.not.toThrow();
    });

    it('should handle missing required fields gracefully', async () => {
      const incompleteEntry = {
        step: 'test_step',
        sessionId: 'test-session-123',
        timestamp: new Date()
      } as any;

      // Should not throw even with missing fields
      await expect(memoryService.storeLLMCall(incompleteEntry)).resolves.not.toThrow();
    });

    it('should handle complex nested objects in input and output', async () => {
      const entry: LLMCallEntry = {
        step: 'complex_test',
        input: {
          nested: {
            deep: {
              value: 'test',
              array: [1, 2, 3]
            }
          },
          list: ['a', 'b', 'c']
        },
        output: {
          result: {
            data: {
              items: [
                { id: 1, name: 'item1' },
                { id: 2, name: 'item2' }
              ]
            }
          }
        },
        sessionId: 'test-session-123',
        timestamp: new Date()
      };

      await expect(memoryService.storeLLMCall(entry)).resolves.not.toThrow();
    });

    it('should handle entries with all optional fields populated', async () => {
      const entry: LLMCallEntry = {
        step: 'full_test',
        input: { data: 'input' },
        output: { data: 'output' },
        sessionId: 'session-123',
        userId: 'user-456',
        workflowType: 'workflow_summarization',
        timestamp: new Date(),
        metadata: {
          source: 'test',
          version: '1.0',
          tags: ['test', 'memory']
        }
      };

      await expect(memoryService.storeLLMCall(entry)).resolves.not.toThrow();
    });

    it('should handle multiple sequential calls without errors', async () => {
      const entries: LLMCallEntry[] = [
        {
          step: 'step1',
          input: { data: 'input1' },
          output: { data: 'output1' },
          sessionId: 'session-123',
          timestamp: new Date()
        },
        {
          step: 'step2',
          input: { data: 'input2' },
          output: { data: 'output2' },
          sessionId: 'session-123',
          timestamp: new Date()
        },
        {
          step: 'step3',
          input: { data: 'input3' },
          output: { data: 'output3' },
          sessionId: 'session-123',
          timestamp: new Date()
        }
      ];

      // All calls should complete without throwing
      for (const entry of entries) {
        await expect(memoryService.storeLLMCall(entry)).resolves.not.toThrow();
      }
    });
  });

  describe('isAvailable', () => {
    it('should return a boolean', () => {
      const result = memoryService.isAvailable();
      expect(typeof result).toBe('boolean');
    });
  });

  describe('getHealthStatus', () => {
    it('should return health status with required fields', () => {
      const status = memoryService.getHealthStatus();
      
      expect(status).toHaveProperty('isAvailable');
      expect(status).toHaveProperty('isHealthy');
      expect(status).toHaveProperty('failureCount');
      expect(status).toHaveProperty('mode');
      expect(['active', 'degraded', 'disabled']).toContain(status.mode);
    });
  });
});
