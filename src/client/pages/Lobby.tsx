import { useEffect, useState } from 'react';
import type { RoomSummary } from '@shared/types';
import { TIME_CONTROLS } from '@shared/timeControls';
import { useI18n } from '../i18n/I18nProvider';
import { useRouter } from '../router';
import { getSocket } from '../socket';
import { CreateRoomDialog } from '../components/CreateRoomDialog';
import styles from '../components/styles/Lobby.module.css';

export function Lobby() {
  const { t } = useI18n();
  const { navigate } = useRouter();
  const [rooms, setRooms] = useState<RoomSummary[]>([]);
  const [showCreate, setShowCreate] = useState(false);
  const [joinTarget, setJoinTarget] = useState<RoomSummary | null>(null);
  const [joinPassword, setJoinPassword] = useState('');
  const [joinError, setJoinError] = useState<string | null>(null);

  useEffect(() => {
    const socket = getSocket();
    const refresh = () =>
      socket.emit('lobby:list', res => res.ok && setRooms(res.data));
    refresh();
    if (socket.connected) refresh();
    socket.on('connect', refresh);

    const onAdded = (r: RoomSummary) =>
      setRooms(prev => [r, ...prev.filter(x => x.id !== r.id)]);
    const onUpdated = (r: RoomSummary) =>
      setRooms(prev => prev.map(x => (x.id === r.id ? r : x)));
    const onRemoved = ({ id }: { id: string }) =>
      setRooms(prev => prev.filter(x => x.id !== id));

    socket.on('lobby:room_added', onAdded);
    socket.on('lobby:room_updated', onUpdated);
    socket.on('lobby:room_removed', onRemoved);
    return () => {
      socket.off('connect', refresh);
      socket.off('lobby:room_added', onAdded);
      socket.off('lobby:room_updated', onUpdated);
      socket.off('lobby:room_removed', onRemoved);
    };
  }, []);

  const doJoin = (roomId: string, password?: string) => {
    getSocket().emit('lobby:join', { roomId, password }, res => {
      if (res.ok) {
        navigate(`/room/${roomId}`);
      } else {
        setJoinError(
          res.error === 'wrong_password'
            ? 'join_err_wrong_password'
            : res.error === 'full'
              ? 'join_err_full'
              : 'join_err_not_found'
        );
      }
    });
  };

  const onJoinClick = (room: RoomSummary) => {
    setJoinError(null);
    if (room.isPrivate) {
      setJoinPassword('');
      setJoinTarget(room);
    } else {
      doJoin(room.id);
    }
  };

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <h1>{t('lobby_title')}</h1>
        <button className={styles.create} onClick={() => setShowCreate(true)}>
          + {t('lobby_create')}
        </button>
      </div>

      {rooms.length === 0 ? (
        <p className={styles.empty}>{t('lobby_empty')}</p>
      ) : (
        <ul className={styles.list}>
          {rooms.map(room => (
            <li key={room.id} className={styles.card}>
              <div className={styles.cardMain}>
                <span className={styles.roomName}>
                  {room.isPrivate && <span className={styles.lock}>🔒</span>}
                  {room.name}
                </span>
                <span className={styles.meta}>
                  <span className={styles.badge}>
                    {TIME_CONTROLS[room.timeControl].label}
                  </span>
                  <span className={styles.players}>
                    {t('lobby_players', { n: room.players })}
                  </span>
                </span>
              </div>
              <button className={styles.join} onClick={() => onJoinClick(room)}>
                {t('lobby_join')}
              </button>
            </li>
          ))}
        </ul>
      )}

      {showCreate && (
        <CreateRoomDialog
          onClose={() => setShowCreate(false)}
          onCreated={roomId => navigate(`/room/${roomId}`)}
        />
      )}

      {joinTarget && (
        <div className={styles.overlay} onClick={() => setJoinTarget(null)}>
          <form
            className={styles.passModal}
            onClick={e => e.stopPropagation()}
            onSubmit={e => {
              e.preventDefault();
              doJoin(joinTarget.id, joinPassword);
            }}
          >
            <p>{t('join_password_prompt')}</p>
            <input
              className={styles.passInput}
              type="password"
              value={joinPassword}
              autoFocus
              onChange={e => setJoinPassword(e.target.value)}
            />
            {joinError && (
              <p className={styles.joinErr}>{t(joinError as never)}</p>
            )}
            <div className={styles.passActions}>
              <button type="button" onClick={() => setJoinTarget(null)}>
                {t('create_cancel')}
              </button>
              <button type="submit">{t('lobby_join')}</button>
            </div>
          </form>
        </div>
      )}

      {joinError && !joinTarget && (
        <p className={styles.joinErr}>{t(joinError as never)}</p>
      )}
    </div>
  );
}
