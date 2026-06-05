import { ToastService } from './toast.service';

describe('ToastService', () => {
  let service: ToastService;

  beforeEach(() => {
    service = new ToastService();
    jest.useFakeTimers();
  });
  afterEach(() => jest.useRealTimers());

  it('starts empty', () => {
    expect(service.toasts()).toEqual([]);
  });

  it('success() adds a toast of type success', () => {
    service.success('Saved');
    expect(service.toasts()).toEqual([expect.objectContaining({ type: 'success', message: 'Saved' })]);
  });

  it('error() uses the danger type', () => {
    service.error('Boom');
    expect(service.toasts()[0].type).toBe('danger');
  });

  it('auto-dismisses after the duration', () => {
    service.show('hi', 'info', 1000);
    expect(service.toasts().length).toBe(1);
    jest.advanceTimersByTime(1000);
    expect(service.toasts().length).toBe(0);
  });

  it('dismiss() removes a specific toast', () => {
    service.show('a');
    service.show('b');
    const firstId = service.toasts()[0].id;
    service.dismiss(firstId);
    expect(service.toasts().map((t) => t.message)).toEqual(['b']);
  });
});
