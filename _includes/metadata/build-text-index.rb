#!/usr/bin/env ruby
# Generate the website's text index from the local scores checkout.
require 'json'
require 'tempfile'

def local_text_entries(repo)
  directory = File.join(repo, 'texts')
  raise "Scores checkout has no texts directory: #{directory}" unless File.directory?(directory)

  Dir.glob(File.join(directory, '**', '*')).select { |path| File.file?(path) }.map do |path|
    { 'path' => path.delete_prefix(directory + File::SEPARATOR), 'type' => 'blob' }
  end
end

def build_text_index(entries)
  entries.sort_by { |entry| entry.fetch('path') }.each_with_object({}) do |entry, index|
    path = entry.fetch('path')
    next unless entry['type'] == 'blob' && File.extname(path).downcase == '.txt'

    match = /\A([A-Z][a-z]{2}[0-9]{4}[a-z]*)-.+\.txt\z/.match(File.basename(path))
    raise "Invalid text filename: texts/#{path}" unless match
    id = match[1]
    raise "Duplicate text ID #{id}: #{index[id]} and texts/#{path}" if index.key?(id)

    index[id] = "texts/#{path}"
  end
end

if $PROGRAM_NAME == __FILE__
  begin
    repo = File.expand_path(ENV.fetch('JRP_SCORES_DIR', '../../../jrp-scores'), __dir__)
    index = build_text_index(local_text_entries(repo))
    destination = File.join(__dir__, 'texts.json')
    # Replace the index only after a complete, validated local scan.
    Tempfile.create(['texts-', '.json'], __dir__) do |file|
      file.write(JSON.pretty_generate(index) + "\n")
      file.close
      File.rename(file.path, destination)
    end
    puts "Indexed #{index.length} work texts in #{destination}"
  rescue StandardError => error
    warn "Text index unchanged: #{error.message}"
    exit 1
  end
end
