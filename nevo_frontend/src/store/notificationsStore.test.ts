import { useNotificationsStore } from '@/src/store/notificationsStore';

const baseNotification = {
  type: 'donation' as const,
  title: 'New Donation',
  message: 'Someone donated 10 XLM',
  link: '/pools/123',
};

beforeEach(() => useNotificationsStore.setState({ notifications: [] }));

describe('notificationsStore', () => {
  describe('addNotification', () => {
    it('adds a notification to the store', () => {
      useNotificationsStore.getState().addNotification(baseNotification);
      expect(useNotificationsStore.getState().notifications).toHaveLength(1);
    });

    it('prepends new notifications', () => {
      useNotificationsStore.getState().addNotification({
        ...baseNotification,
        title: 'First',
      });
      useNotificationsStore.getState().addNotification({
        ...baseNotification,
        title: 'Second',
      });
      const { notifications } = useNotificationsStore.getState();
      expect(notifications[0].title).toBe('Second');
      expect(notifications[1].title).toBe('First');
    });

    it('sets isRead to false', () => {
      useNotificationsStore.getState().addNotification(baseNotification);
      const { notifications } = useNotificationsStore.getState();
      expect(notifications[0].isRead).toBe(false);
    });

    it('generates an id', () => {
      useNotificationsStore.getState().addNotification(baseNotification);
      const { notifications } = useNotificationsStore.getState();
      expect(notifications[0].id).toBeDefined();
      expect(notifications[0].id).toMatch(/^notif-/);
    });

    it('sets a timestamp', () => {
      useNotificationsStore.getState().addNotification(baseNotification);
      const { notifications } = useNotificationsStore.getState();
      expect(notifications[0].timestamp).toBeDefined();
    });
  });

  describe('markAsRead', () => {
    it('marks a single notification as read', () => {
      useNotificationsStore.getState().addNotification(baseNotification);
      const { id } = useNotificationsStore.getState().notifications[0];
      useNotificationsStore.getState().markAsRead(id);
      expect(useNotificationsStore.getState().notifications[0].isRead).toBe(
        true
      );
    });

    it('does not affect other notifications', () => {
      useNotificationsStore.getState().addNotification({
        ...baseNotification,
        title: 'A',
      });
      useNotificationsStore.getState().addNotification({
        ...baseNotification,
        title: 'B',
      });
      const [b, a] = useNotificationsStore.getState().notifications;
      useNotificationsStore.getState().markAsRead(a.id);
      const state = useNotificationsStore.getState().notifications;
      const updatedA = state.find((n) => n.id === a.id);
      const updatedB = state.find((n) => n.id === b.id);
      expect(updatedA!.isRead).toBe(true);
      expect(updatedB!.isRead).toBe(false);
    });
  });

  describe('markAllAsRead', () => {
    it('marks all notifications as read', () => {
      useNotificationsStore.getState().addNotification(baseNotification);
      useNotificationsStore.getState().addNotification({
        ...baseNotification,
        title: 'Another',
      });
      useNotificationsStore.getState().markAllAsRead();
      const { notifications } = useNotificationsStore.getState();
      expect(notifications).toHaveLength(2);
      notifications.forEach((n) => expect(n.isRead).toBe(true));
    });

    it('does nothing on empty list', () => {
      expect(() =>
        useNotificationsStore.getState().markAllAsRead()
      ).not.toThrow();
      expect(useNotificationsStore.getState().notifications).toHaveLength(0);
    });
  });

  describe('deleteNotification', () => {
    it('removes a notification by id', () => {
      useNotificationsStore.getState().addNotification(baseNotification);
      const { id } = useNotificationsStore.getState().notifications[0];
      useNotificationsStore.getState().deleteNotification(id);
      expect(useNotificationsStore.getState().notifications).toHaveLength(0);
    });

    it('removes only the targeted notification', () => {
      useNotificationsStore.getState().addNotification({
        ...baseNotification,
        title: 'Keep',
      });
      useNotificationsStore.getState().addNotification({
        ...baseNotification,
        title: 'Remove',
      });
      const { id } = useNotificationsStore.getState().notifications[0]; // newest first = 'Remove'
      useNotificationsStore.getState().deleteNotification(id);
      const { notifications } = useNotificationsStore.getState();
      expect(notifications).toHaveLength(1);
      expect(notifications[0].title).toBe('Keep');
    });
  });

  describe('clearAll', () => {
    it('removes all notifications', () => {
      useNotificationsStore.getState().addNotification(baseNotification);
      useNotificationsStore.getState().addNotification({
        ...baseNotification,
        title: 'Second',
      });
      useNotificationsStore.getState().clearAll();
      expect(useNotificationsStore.getState().notifications).toHaveLength(0);
    });

    it('works on already empty store', () => {
      expect(() => useNotificationsStore.getState().clearAll()).not.toThrow();
    });
  });
});
