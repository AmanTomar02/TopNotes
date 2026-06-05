import { ConfirmService } from './confirm.service';

describe('ConfirmService', () => {
  let service: ConfirmService;
  beforeEach(() => (service = new ConfirmService()));

  it('opens with the provided options', () => {
    void service.ask({ message: 'Delete this?', title: 'Delete', confirmText: 'Yes', danger: true });
    const s = service.state();
    expect(s.open).toBe(true);
    expect(s.message).toBe('Delete this?');
    expect(s.title).toBe('Delete');
    expect(s.danger).toBe(true);
  });

  it('resolves true and closes on confirm', async () => {
    const result = service.ask({ message: 'x' });
    service.respond(true);
    await expect(result).resolves.toBe(true);
    expect(service.state().open).toBe(false);
  });

  it('resolves false on cancel', async () => {
    const result = service.ask({ message: 'x' });
    service.respond(false);
    await expect(result).resolves.toBe(false);
  });

  it('defaults title/confirmText when omitted', () => {
    void service.ask({ message: 'x' });
    expect(service.state().title).toBe('Are you sure?');
    expect(service.state().confirmText).toBe('Confirm');
  });
});
