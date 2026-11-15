import ExpoModulesCore
import MediaPlayer

public class NkfyLocalMusicModule: Module {
  private var artworkCache: [String: String] = [:]

  public func definition() -> ModuleDefinition {
    Name("NkfyLocalMusic")

    AsyncFunction("requestPermission") { (promise: Promise) in
      MPMediaLibrary.requestAuthorization { status in
        promise.resolve(self.statusString(status))
      }
    }

    AsyncFunction("getPermissionStatus") { () -> String in
      return self.statusString(MPMediaLibrary.authorizationStatus())
    }

    AsyncFunction("scan") { (promise: Promise) in
      DispatchQueue.global(qos: .userInitiated).async {
        if MPMediaLibrary.authorizationStatus() != .authorized {
          promise.reject("ERR_MUSIC_PERMISSION", "Music library access has not been granted")
          return
        }

        let query = MPMediaQuery.songs()
        let items = query.items ?? []
        var songs: [[String: Any]] = []
        songs.reserveCapacity(items.count)

        for item in items {
          guard let assetURL = item.assetURL else { continue }
          let duration = item.playbackDuration
          guard duration > 15 else { continue }

          let albumId = String(item.albumPersistentID)
          let artwork = self.artworkURI(for: item, albumId: albumId)
          let title = item.title ?? "Untitled"
          let artist = item.artist ?? item.albumArtist ?? "Unknown artist"
          let album = item.albumTitle ?? "Unknown album"

          songs.append([
            "id": "local:\(item.persistentID)",
            "title": title,
            "artist": artist,
            "album": album,
            "albumId": albumId,
            "duration": duration,
            "uri": assetURL.absoluteString,
            "artwork": artwork as Any,
            "folder": album,
            "filename": assetURL.lastPathComponent,
            "trackNumber": item.albumTrackNumber,
            "year": Calendar.current.component(.year, from: item.releaseDate ?? Date()),
            "dateAdded": (item.dateAdded?.timeIntervalSince1970 ?? 0) * 1000
          ])
        }

        promise.resolve(songs)
      }
    }

    AsyncFunction("copyToCache") { (uri: String, _: String?) in
      // iOS media URLs can be played directly through AVFoundation.
      promise.resolve(uri)
    }

    Function("clearLocalCache") {
      true
    }

    Function("isAvailable") {
      true
    }
  }

  private func statusString(_ status: MPMediaLibraryAuthorizationStatus) -> String {
    switch status {
    case .authorized:
      return "granted"
    case .denied:
      return "denied"
    case .restricted:
      return "restricted"
    case .notDetermined:
      return "undetermined"
    @unknown default:
      return "undetermined"
    }
  }

  private func artworkURI(for item: MPMediaItem, albumId: String) -> String? {
    if let cached = artworkCache[albumId] {
      return cached
    }

    guard let image = item.artwork?.image(at: CGSize(width: 600, height: 600)) else {
      return nil
    }
    guard let data = image.jpegData(compressionQuality: 0.82) else {
      return nil
    }

    let directory = FileManager.default.urls(for: .cachesDirectory, in: .userDomainMask)[0]
      .appendingPathComponent("nkfy-artwork", isDirectory: true)
    try? FileManager.default.createDirectory(at: directory, withIntermediateDirectories: true)

    let file = directory.appendingPathComponent("\(albumId).jpg")
    guard (try? data.write(to: file, options: .atomic)) != nil else {
      return nil
    }

    let uri = file.absoluteString
    artworkCache[albumId] = uri
    return uri
  }
}
