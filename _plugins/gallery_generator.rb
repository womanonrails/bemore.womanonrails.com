# frozen_string_literal: true

require 'fileutils'
require 'mini_magick'

module Reading
  class Generator < Jekyll::Generator
    def generate(site)
      @site = site
      ensure_folders_exist
      process_images
    end

    private

    attr_reader :site

    def add_watermark!(image)
      config_watermark = config['watermark']
      alpha = (config_watermark['opacity'] || 50).to_f / 100.0
      # _color = config_watermark['color'] || 'white'
      font_size = (config_watermark['font_size'] || 16).to_i

      image.combine_options do |command|
        command.gravity 'South'
        command.pointsize font_size
        command.fill "rgba(255, 255, 255, #{alpha})"
        command.draw "text 0,10 '#{config_watermark['text']}'"
      end
    end

    def config
      site.config['gallery']
    end

    def ensure_folders_exist
      FileUtils.mkdir_p(output_images_path) unless File.directory?(output_images_path)
      FileUtils.mkdir_p(thumbnails_path) unless File.directory?(thumbnails_path)
    end

    def generate_image(image_path, image_name)
      output_image_path = File.join(output_images_path, image_name)
      return if File.exist?(output_image_path)

      image = MiniMagick::Image.open(image_path)
      add_watermark!(image) if config['watermark']['text']
      image.write(output_image_path)
      puts "Image generated: #{image_name}"
    end

    def generate_thumbnail(image_path, image_name)
      thumbnail_path = File.join(thumbnails_path, image_name)
      return if File.exist?(thumbnail_path)

      image = MiniMagick::Image.open(image_path)
      image.resize(config['thumbnails']['size']) if config['thumbnails']['size']
      image.write(thumbnail_path)
      puts "Thumbnail generated: #{image_name}"
    end

    def input_images_path
      extensions = config['input']['extensions'] || 'jpg,jpeg,png'
      "#{site.source}/#{config['input']['path']}/*.{#{extensions}}"
    end

    def output_images_path
      "#{site.source}/#{config['output']['path']}"
    end

    def process_images
      Dir.glob(input_images_path).each do |input_image_path|
        image_name = File.basename(input_image_path)
        generate_image(input_image_path, image_name)
        generate_thumbnail(input_image_path, image_name)
      end
    end

    def thumbnails_path
      "#{site.source}/#{config['thumbnails']['path']}"
    end
  end
end
