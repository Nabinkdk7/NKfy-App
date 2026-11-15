Pod::Spec.new do |s|
  s.name           = 'NkfyLocalMusic'
  s.version        = '1.0.0'
  s.summary        = 'On-device music library reader for NKfy'
  s.description    = 'Reads the local Apple Music library so NKfy can play songs stored on the device.'
  s.license        = 'MIT'
  s.author         = 'NKfy'
  s.homepage       = 'https://nkfy.app'
  s.platforms      = { :ios => '16.4' }
  s.swift_version  = '5.9'
  s.source         = { :path => '.' }
  s.static_framework = true

  s.dependency 'ExpoModulesCore'

  s.source_files = "**/*.{h,m,swift}"
  s.pod_target_xcconfig = {
    'DEFINES_MODULE' => 'YES',
    'SWIFT_COMPILATION_MODE' => 'wholemodule'
  }
end
