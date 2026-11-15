package com.nkfy.localmusic

import android.content.ContentUris
import android.net.Uri
import android.provider.MediaStore
import expo.modules.kotlin.exception.CodedException
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition

class NkfyLocalMusicModule : Module() {
  override fun definition() = ModuleDefinition {
    Name("NkfyLocalMusic")

    AsyncFunction("scan") {
      val context = appContext.reactContext
        ?: throw CodedException("The Android context is not available")

      val collection = MediaStore.Audio.Media.EXTERNAL_CONTENT_URI
      val projection = arrayOf(
        MediaStore.Audio.Media._ID,
        MediaStore.Audio.Media.TITLE,
        MediaStore.Audio.Media.ARTIST,
        MediaStore.Audio.Media.ALBUM,
        MediaStore.Audio.Media.ALBUM_ID,
        MediaStore.Audio.Media.DURATION,
        MediaStore.Audio.Media.DISPLAY_NAME,
        MediaStore.Audio.Media.TRACK,
        MediaStore.Audio.Media.YEAR,
        MediaStore.Audio.Media.DATE_ADDED,
        MediaStore.Audio.Media.RELATIVE_PATH
      )

      val selection = "${MediaStore.Audio.Media.IS_MUSIC} != 0 AND " +
        "${MediaStore.Audio.Media.DURATION} > 15000"

      val songs = mutableListOf<Map<String, Any?>>()

      context.contentResolver.query(
        collection,
        projection,
        selection,
        null,
        "${MediaStore.Audio.Media.TITLE} COLLATE NOCASE ASC"
      )?.use { cursor ->
        val idColumn = cursor.getColumnIndexOrThrow(MediaStore.Audio.Media._ID)
        val titleColumn = cursor.getColumnIndexOrThrow(MediaStore.Audio.Media.TITLE)
        val artistColumn = cursor.getColumnIndexOrThrow(MediaStore.Audio.Media.ARTIST)
        val albumColumn = cursor.getColumnIndexOrThrow(MediaStore.Audio.Media.ALBUM)
        val albumIdColumn = cursor.getColumnIndexOrThrow(MediaStore.Audio.Media.ALBUM_ID)
        val durationColumn = cursor.getColumnIndexOrThrow(MediaStore.Audio.Media.DURATION)
        val filenameColumn = cursor.getColumnIndexOrThrow(MediaStore.Audio.Media.DISPLAY_NAME)
        val trackColumn = cursor.getColumnIndexOrThrow(MediaStore.Audio.Media.TRACK)
        val yearColumn = cursor.getColumnIndexOrThrow(MediaStore.Audio.Media.YEAR)
        val dateAddedColumn = cursor.getColumnIndexOrThrow(MediaStore.Audio.Media.DATE_ADDED)
        val pathColumn = cursor.getColumnIndex(MediaStore.Audio.Media.RELATIVE_PATH)

        while (cursor.moveToNext()) {
          val id = cursor.getLong(idColumn)
          val albumId = cursor.getLong(albumIdColumn)
          val artist = cursor.getString(artistColumn)?.takeUnless { it == "<unknown>" } ?: "Unknown artist"
          val album = cursor.getString(albumColumn)?.takeUnless { it == "<unknown>" } ?: "Unknown album"
          val title = cursor.getString(titleColumn)?.takeIf { it.isNotBlank() }
            ?: cursor.getString(filenameColumn)
            ?: "Untitled"
          val trackNumber = cursor.getInt(trackColumn)
          val relativePath = if (pathColumn >= 0) cursor.getString(pathColumn) else null

          songs.add(
            mapOf(
              "id" to "local:$id",
              "title" to title,
              "artist" to artist,
              "album" to album,
              "albumId" to albumId.toString(),
              "duration" to cursor.getLong(durationColumn) / 1000.0,
              "uri" to ContentUris.withAppendedId(collection, id).toString(),
              "artwork" to ContentUris.withAppendedId(
                Uri.parse("content://media/external/audio/albumart"),
                albumId
              ).toString(),
              "folder" to (relativePath ?: album),
              "filename" to (cursor.getString(filenameColumn) ?: ""),
              "trackNumber" to (if (trackNumber > 0) trackNumber % 1000 else 0),
              "year" to cursor.getInt(yearColumn),
              "dateAdded" to cursor.getLong(dateAddedColumn) * 1000
            )
          )
        }
      }

      songs
    }

    Function("isAvailable") {
      true
    }
  }
}
