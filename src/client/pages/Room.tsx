import type {
  ChatMessage,
  Color,
  GameOver,
  GameSnapshot,
  GameStateUpdate
} from '@shared/types';
import { useEffect, useMemo, useState } from 'react';

import { isInfinite } from '@shared/timeControls';
import { opposite } from '@shared/types';
import { Board } from '../components/Board/Board';
import { CapturedTray } from '../components/CapturedTray';
import { Chat } from '../components/Chat';
import { Clock } from '../components/Clock';
import { MoveList } from '../components/MoveList';
import { ResultModal } from '../components/ResultModal';
import styles from '../components/styles/Room.module.css';
import { useI18n } from '../i18n/I18nProvider';
import { Link } from '../router';
import { getSocket } from '../socket';

const START_FEN = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';

export function Room({ roomId }: { roomId: string }) {
  const { t } = useI18n();
  const [snap, setSnap] = useState<GameSnapshot | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [opponentGone, setOpponentGone] = useState(false);

  useEffect(() => {
    const socket = getSocket();

    const enter = () => {
      socket.emit('game:rejoin', { roomId }, res => {
        if (res.ok) {
          setSnap(res.data);
        } else {
          // Not yet a player (e.g. followed a public link) — try to join a seat.
          socket.emit('lobby:join', { roomId }, joinRes => {
            if (joinRes.ok) setSnap(joinRes.data);
            else setError(joinRes.error);
          });
        }
      });
    };
    enter();
    socket.on('connect', enter);

    const socketEvents = {
      ['game:start']: (s: GameSnapshot) => setSnap(s),
      ['game:state']: (u: GameStateUpdate) =>
        setSnap(prev => (prev ? { ...prev, ...u } : prev)),
      ['clock:tick']: (clock: GameStateUpdate['clock']) =>
        setSnap(prev => (prev ? { ...prev, clock } : prev)),
      ['chat:message']: (m: ChatMessage) =>
        setSnap(prev => (prev ? { ...prev, chat: [...prev.chat, m] } : prev)),
      ['game:over']: (result: GameOver) =>
        setSnap(prev =>
          prev ? { ...prev, result, status: 'finished' } : prev
        ),
      ['game:draw_offered']: ({ by }: { by: Color }) =>
        setSnap(prev => (prev ? { ...prev, drawOfferBy: by } : prev)),
      ['game:draw_declined']: () =>
        setSnap(prev => (prev ? { ...prev, drawOfferBy: null } : prev)),
      ['game:opponent_disconnected']: () => setOpponentGone(true),
      ['game:opponent_reconnected']: () => setOpponentGone(false)
    };

    Object.entries(socketEvents).forEach(([event, handler]) =>
      socket.on(event as any, handler)
    );

    return () => {
      Object.entries(socketEvents).forEach(([event, handler]) =>
        socket.off(event as any, handler)
      );
    };
  }, [roomId]);

  const shareUrl = useMemo(
    () =>
      typeof window !== 'undefined'
        ? `${window.location.origin}/room/${roomId}`
        : '',
    [roomId]
  );

  if (error) {
    return (
      <div className={styles.centered}>
        <p>
          {t(
            error === 'wrong_password'
              ? 'join_err_wrong_password'
              : error === 'full'
                ? 'join_err_full'
                : 'join_err_not_found'
          )}
        </p>
        <Link to="/" className={styles.backLink}>
          {t('room_back_lobby')}
        </Link>
      </div>
    );
  }

  if (!snap)
    return <div className={styles.centered}>{t('common_loading')}</div>;

  const myColor: Color = snap.yourColor ?? 'w';
  const oppColor = opposite(myColor);
  const fen = snap.fen || START_FEN;
  const turn = snap.turn;
  const playing = snap.status === 'playing' && !snap.result;
  const interactive = playing && turn === myColor;
  const infinite = isInfinite(snap.timeControl);

  const me = snap.players.find(p => p.color === myColor);
  const opp = snap.players.find(p => p.color === oppColor);

  const move = (
    from: string,
    to: string,
    promotion?: 'q' | 'r' | 'b' | 'n'
  ) => {
    getSocket().emit(
      'game:move',
      { roomId, from, to, promotion },
      () => undefined
    );
  };
  const sendChat = (text: string) =>
    getSocket().emit('chat:send', { roomId, text });
  const resign = () => {
    if (confirm(t('room_confirm_resign')))
      getSocket().emit('game:resign', { roomId });
  };
  const offerDraw = () => getSocket().emit('game:offer_draw', { roomId });
  const respondDraw = (accept: boolean) =>
    getSocket().emit('game:respond_draw', { roomId, accept });

  const waiting = snap.status === 'waiting';
  const turnLabel = playing
    ? interactive
      ? t('room_your_turn')
      : t('room_their_turn')
    : '';

  return (
    <div className={styles.room}>
      <div className={styles.boardColumn}>
        <PlayerBar
          name={opp?.username ?? '—'}
          colorLabel={t(oppColor === 'w' ? 'room_white' : 'room_black')}
          connected={opp ? opp.connected && !opponentGone : false}
          clock={
            <Clock
              ms={snap.clock[oppColor]}
              running={snap.clock.running === oppColor && playing}
              infinite={infinite}
              active={turn === oppColor && playing}
              label={oppColor === 'w' ? '♔' : '♚'}
            />
          }
          captured={<CapturedTray fen={fen} capturedColor={myColor} />}
        />

        <Board
          fen={fen}
          orientation={myColor}
          myColor={myColor}
          interactive={interactive}
          lastMove={snap.lastMove}
          onMove={move}
        />

        <PlayerBar
          name={`${me?.username ?? '—'} (${t('room_you')})`}
          colorLabel={t(myColor === 'w' ? 'room_white' : 'room_black')}
          connected
          clock={
            <Clock
              ms={snap.clock[myColor]}
              running={snap.clock.running === myColor && playing}
              infinite={infinite}
              active={turn === myColor && playing}
              label={myColor === 'w' ? '♔' : '♚'}
            />
          }
          captured={<CapturedTray fen={fen} capturedColor={oppColor} />}
        />
      </div>

      <aside className={styles.sidebar}>
        <div className={styles.statusBar}>
          <strong>{snap.name}</strong>
          {turnLabel && <span className={styles.turn}>{turnLabel}</span>}
        </div>

        {opponentGone && playing && (
          <p className={styles.notice}>{t('room_opponent_left')}</p>
        )}

        {waiting && (
          <div className={styles.waiting}>
            <p>{t('room_waiting')}</p>
            <p className={styles.shareLabel}>{t('room_share')}</p>
            <input
              className={styles.share}
              readOnly
              value={shareUrl}
              onFocus={e => e.target.select()}
            />
          </div>
        )}

        {playing && (
          <div className={styles.controls}>
            {snap.drawOfferBy && snap.drawOfferBy === oppColor ? (
              <div className={styles.drawOffer}>
                <p>{t('room_draw_offered_them')}</p>
                <div className={styles.drawButtons}>
                  <button
                    className={styles.accept}
                    onClick={() => respondDraw(true)}
                  >
                    {t('room_accept')}
                  </button>
                  <button
                    className={styles.decline}
                    onClick={() => respondDraw(false)}
                  >
                    {t('room_decline')}
                  </button>
                </div>
              </div>
            ) : snap.drawOfferBy === myColor ? (
              <p className={styles.notice}>{t('room_draw_offered_you')}</p>
            ) : (
              <button className={styles.ctrlBtn} onClick={offerDraw}>
                ½ {t('room_offer_draw')}
              </button>
            )}
            <button className={styles.resignBtn} onClick={resign}>
              🏳 {t('room_resign')}
            </button>
          </div>
        )}

        <MoveList history={snap.history} />
        <Chat messages={snap.chat} onSend={sendChat} />
      </aside>

      {snap.result && (
        <ResultModal result={snap.result} myColor={snap.yourColor} />
      )}
    </div>
  );
}

function PlayerBar({
  name,
  colorLabel,
  connected,
  clock,
  captured
}: {
  name: string;
  colorLabel: string;
  connected: boolean;
  clock: React.ReactNode;
  captured: React.ReactNode;
}) {
  return (
    <div className={styles.playerBar}>
      <div className={styles.playerInfo}>
        <span className={connected ? styles.dotOn : styles.dotOff} />
        <span className={styles.playerName}>{name}</span>
        <span className={styles.colorLabel}>{colorLabel}</span>
        {captured}
      </div>
      {clock}
    </div>
  );
}
