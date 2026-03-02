package com.crowdcount.app.data;

import android.database.Cursor;
import android.os.CancellationSignal;
import androidx.annotation.NonNull;
import androidx.room.CoroutinesRoom;
import androidx.room.EntityInsertionAdapter;
import androidx.room.RoomDatabase;
import androidx.room.RoomSQLiteQuery;
import androidx.room.util.CursorUtil;
import androidx.room.util.DBUtil;
import androidx.sqlite.db.SupportSQLiteStatement;
import java.lang.Class;
import java.lang.Exception;
import java.lang.Object;
import java.lang.Override;
import java.lang.String;
import java.lang.SuppressWarnings;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.concurrent.Callable;
import kotlin.Unit;
import kotlin.coroutines.Continuation;

@SuppressWarnings({"unchecked", "deprecation"})
public final class DetectionDao_Impl implements DetectionDao {
  private final RoomDatabase __db;

  private final EntityInsertionAdapter<Detection> __insertionAdapterOfDetection;

  public DetectionDao_Impl(@NonNull final RoomDatabase __db) {
    this.__db = __db;
    this.__insertionAdapterOfDetection = new EntityInsertionAdapter<Detection>(__db) {
      @Override
      @NonNull
      protected String createQuery() {
        return "INSERT OR ABORT INTO `detections` (`id`,`zoneId`,`crowdCount`,`timestamp`) VALUES (nullif(?, 0),?,?,?)";
      }

      @Override
      protected void bind(@NonNull final SupportSQLiteStatement statement,
          @NonNull final Detection entity) {
        statement.bindLong(1, entity.getId());
        statement.bindLong(2, entity.getZoneId());
        statement.bindLong(3, entity.getCrowdCount());
        statement.bindLong(4, entity.getTimestamp());
      }
    };
  }

  @Override
  public Object insert(final Detection detection, final Continuation<? super Unit> $completion) {
    return CoroutinesRoom.execute(__db, true, new Callable<Unit>() {
      @Override
      @NonNull
      public Unit call() throws Exception {
        __db.beginTransaction();
        try {
          __insertionAdapterOfDetection.insert(detection);
          __db.setTransactionSuccessful();
          return Unit.INSTANCE;
        } finally {
          __db.endTransaction();
        }
      }
    }, $completion);
  }

  @Override
  public Object getAllDetections(final Continuation<? super List<Detection>> $completion) {
    final String _sql = "SELECT * FROM detections";
    final RoomSQLiteQuery _statement = RoomSQLiteQuery.acquire(_sql, 0);
    final CancellationSignal _cancellationSignal = DBUtil.createCancellationSignal();
    return CoroutinesRoom.execute(__db, false, _cancellationSignal, new Callable<List<Detection>>() {
      @Override
      @NonNull
      public List<Detection> call() throws Exception {
        final Cursor _cursor = DBUtil.query(__db, _statement, false, null);
        try {
          final int _cursorIndexOfId = CursorUtil.getColumnIndexOrThrow(_cursor, "id");
          final int _cursorIndexOfZoneId = CursorUtil.getColumnIndexOrThrow(_cursor, "zoneId");
          final int _cursorIndexOfCrowdCount = CursorUtil.getColumnIndexOrThrow(_cursor, "crowdCount");
          final int _cursorIndexOfTimestamp = CursorUtil.getColumnIndexOrThrow(_cursor, "timestamp");
          final List<Detection> _result = new ArrayList<Detection>(_cursor.getCount());
          while (_cursor.moveToNext()) {
            final Detection _item;
            final int _tmpId;
            _tmpId = _cursor.getInt(_cursorIndexOfId);
            final int _tmpZoneId;
            _tmpZoneId = _cursor.getInt(_cursorIndexOfZoneId);
            final int _tmpCrowdCount;
            _tmpCrowdCount = _cursor.getInt(_cursorIndexOfCrowdCount);
            final long _tmpTimestamp;
            _tmpTimestamp = _cursor.getLong(_cursorIndexOfTimestamp);
            _item = new Detection(_tmpId,_tmpZoneId,_tmpCrowdCount,_tmpTimestamp);
            _result.add(_item);
          }
          return _result;
        } finally {
          _cursor.close();
          _statement.release();
        }
      }
    }, $completion);
  }

  @NonNull
  public static List<Class<?>> getRequiredConverters() {
    return Collections.emptyList();
  }
}
