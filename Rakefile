# Rakefile forked from https://github.com/cezarsa/chromed_bird/blob/master/Rakefile
require 'crxmake'
require 'openssl'
require 'digest/sha2'
require 'json'

class ExtensionInfo
  attr_reader :id, :name, :version
  def initialize public_key, path
    @id = generate_id(public_key)
    @path = path
    load_manifest
  end

  private
  def load_manifest
    json_data = File.read(File.join(@path, 'manifest.json'))
    manifest_data = JSON.parse(json_data)
    @name = manifest_data['name']
    @version = manifest_data['version']
  end

  def generate_id public_key
    hex_id = Digest::SHA2.hexdigest(public_key)
    hex_id[0...32].split('').map do |char|
      (char.hex + 'a'[0]).chr
    end.join
  end
end

# from crxmake.rb
def key_algo 
  %w(30 81 9F 30 0D 06 09 2A 86 48 86 F7 0D 01 01 01 05 00 03 81 8D 00).map{|s| s.hex}.pack('C*')
end

module Constants
  KEY_FILE = "../mousehunt-alerter.pem"
  IGNORE_DIR = /\.git/
  IGNORE_FILE = /Rakefile|\.gitignore|.*\.crx$|.*\.zip|\.project$/
  KEY_ALGO = key_algo
end

# from crxmake
def read_key pkey 
  File.open(pkey, 'rb') do |io|
    key = OpenSSL::PKey::RSA.new(io)
  end
end

def current_branch
  `git branch` =~ /\* (.*)$/i
  current_branch = $1
end

def get_filename(extension, ext)
  File.expand_path("./mousehunt_alerter_#{extension.id}_#{extension.version}_#{current_branch}.#{ext}")
end

@crxmake_hash = {
  :ex_dir => ".",
  :pkey => Constants::KEY_FILE,
  :verbose => false,
  :ignorefile => Constants::IGNORE_FILE,
  :ignoredir => Constants::IGNORE_DIR
}

def make_crx(key_file)
  key = read_key key_file
  extension = ExtensionInfo.new(Constants::KEY_ALGO + key.public_key.to_der, ".")
  crxmake_hash = @crxmake_hash.dup
  crxmake_hash[:pkey] = key_file
  crxmake_hash[:crx_output] = get_filename(extension,'crx')
  CrxMake.make(crxmake_hash)
end

task :default => :'pack:default'

namespace :pack do
  desc 'pack extension using main key'
  task :default do
    make_crx(Constants::KEY_FILE)
  end

  desc 'pack extension using a generated key'
  task :random do
    make_crx(nil)
  end
end

desc 'generate zip file for extension gallery'
task :zip do
  key = read_key Constants::KEY_FILE 
  extension = ExtensionInfo.new(Constants::KEY_ALGO + key.public_key.to_der, ".")
  crxmake_hash = @crxmake_hash.dup
  crxmake_hash[:zip_output] = get_filename(extension,'zip')
  CrxMake.zip(crxmake_hash)
end
