import { getRequestId, requestContext } from './request-context';

describe('request-context', () => {
  describe('getRequestId()', () => {
    it('returns undefined when called outside of requestContext.run()', () => {
      expect(getRequestId()).toBeUndefined();
    });

    it('returns the stored requestId when called inside requestContext.run()', (done) => {
      const testRequestId = 'test-request-id-123';

      requestContext.run({ requestId: testRequestId }, () => {
        expect(getRequestId()).toBe(testRequestId);
        done();
      });
    });

    it('returns undefined again after requestContext.run() has exited', (done) => {
      const testRequestId = 'ephemeral-request-id';

      requestContext.run({ requestId: testRequestId }, () => {
        // inside the context — sanity check
        expect(getRequestId()).toBe(testRequestId);
        done();
      });

      // outside the context — must be undefined
      expect(getRequestId()).toBeUndefined();
    });

    it('isolates different requestIds across nested run() calls', (done) => {
      const outerRequestId = 'outer-id';
      const innerRequestId = 'inner-id';

      requestContext.run({ requestId: outerRequestId }, () => {
        expect(getRequestId()).toBe(outerRequestId);

        requestContext.run({ requestId: innerRequestId }, () => {
          expect(getRequestId()).toBe(innerRequestId);
          done();
        });
      });
    });
  });
});
